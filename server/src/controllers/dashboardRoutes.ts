import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';
import { EventService } from '../services/EventService';
import { GroupService } from '../services/GroupService';

// Standard base64 JWT decode helper for best-effort optional authentication
function tryDecodeUserId(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
    try {
        const token = authHeader.substring(7);
        const parts = token.split('.');
        if (parts.length !== 3) return undefined;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const uid = payload?.id;
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uid && UUID_REGEX.test(uid)) {
            return uid;
        }
        return undefined;
    } catch {
        return undefined;
    }
}

// In-Memory cache implementation
interface CacheEntry {
    data: any;
    expiresAt: number;
}
const cache = new Map<string, CacheEntry>();

function getCached(key: string): any | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCached(key: string, data: any, ttlMs: number): void {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Coordinate distance utility (Haversine Formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export const dashboardRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    // 1. GET /hero-events
    fastify.get('/hero-events', async (request: any, reply) => {
        try {
            const cacheKey = 'hero_events';
            const cached = getCached(cacheKey);
            if (cached) return reply.send({ success: true, data: cached });

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Fetch events created within 7 days, published, starts in future, and has cover
            const recentEvents = await prisma.events.findMany({
                where: {
                    status: 'published',
                    starts_at: { gt: new Date() },
                    created_at: { gte: sevenDaysAgo }
                },
                orderBy: { created_at: 'desc' },
                take: 10,
                include: {
                    ticket_types: true
                }
            });

            // Filter to ensure public visibility and cover exists in venue JSON
            let filteredEvents = recentEvents.filter(ev => {
                const venueObj = ev.venue as any;
                const visibility = venueObj?.visibility;
                const cover = venueObj?.meta?.cover;
                return (!visibility || visibility === 'public') && !!cover;
            });

            // Fallback: If less than 3 events, fill with most-attended upcoming public events
            if (filteredEvents.length < 3) {
                const excludedIds = filteredEvents.map(e => e.id);
                const backupEvents = await prisma.events.findMany({
                    where: {
                        id: { notIn: excludedIds },
                        status: 'published',
                        starts_at: { gt: new Date() }
                    },
                    include: {
                        ticket_types: true,
                        bookings: {
                            where: { status: 'confirmed' }
                        }
                    }
                });

                const sortedBackups = backupEvents
                    .filter(ev => {
                        const venueObj = ev.venue as any;
                        const visibility = venueObj?.visibility;
                        return !visibility || visibility === 'public';
                    })
                    .sort((a, b) => b.bookings.length - a.bookings.length)
                    .slice(0, 10 - filteredEvents.length);

                filteredEvents = [...filteredEvents, ...sortedBackups];
            }

            // Enrich host info, wishlist counts
            const userId = tryDecodeUserId(request);
            const enriched = await Promise.all(filteredEvents.map(async (ev) => {
                const hostInfo = await EventService.resolveHostInfo(ev.hosted_by_entity_id).catch(() => ({
                    hostType: null, hostName: null, hostUserId: null, hostPhoto: null
                }));
                const wishlistCount = await prisma.event_wishlist.count({
                    where: { event_id: ev.id }
                });
                const isWishlisted = userId ? await prisma.event_wishlist.findUnique({
                    where: { event_id_user_id: { event_id: ev.id, user_id: userId } }
                }).then(Boolean) : false;

                const venueObj = ev.venue as any;
                return {
                    id: ev.id,
                    title: ev.title,
                    description: ev.description,
                    cover: venueObj?.meta?.cover || null,
                    starts_at: ev.starts_at,
                    ends_at: ev.ends_at,
                    location_type: ev.location_type,
                    venue: venueObj?.name || venueObj?.address || null,
                    registration_mode: ev.registration_mode,
                    ticket_types: ev.ticket_types.map(t => {
                        const price = t.price_amount_minor ? Number(t.price_amount_minor) : 0;
                        return {
                            ...t,
                            price_amount_minor: price,
                            price_minor: price
                        };
                    }),
                    host: {
                        name: hostInfo.hostName,
                        photo: hostInfo.hostPhoto
                    },
                    wishlistCount,
                    isWishlisted
                };
            }));

            // Cache for 5 minutes
            setCached(cacheKey, enriched, 5 * 60 * 1000);
            return reply.send({ success: true, data: enriched });
        } catch (e: any) {
            fastify.log.error(e, 'GET /hero-events failed');
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 2. GET /recommended-events
    fastify.get('/recommended-events', async (request: any, reply) => {
        try {
            const userId = tryDecodeUserId(request);
            const { limit = '10', page = '1', city = '' } = request.query as any;
            const size = parseInt(limit, 10);
            const offset = (parseInt(page, 10) - 1) * size;

            const cacheKey = `rec_${userId || 'anon'}_${city}_${page}_${limit}`;
            const cached = getCached(cacheKey);
            if (cached) return reply.send({ success: true, data: cached });

            // Fetch user preference metadata if authenticated
            let userInterests: string[] = [];
            let userGroups: string[] = [];
            let pastAttendedCategories: string[] = [];
            let userPreferredLocation = '';

            if (userId) {
                const interests = await prisma.user_interests.findMany({
                    where: { user_id: userId },
                    include: { categories: true }
                });
                userInterests = interests.map(i => i.categories.name.toLowerCase());

                const memberships = await prisma.group_memberships.findMany({
                    where: { user_id: userId, state: 'active' },
                    select: { group_id: true }
                });
                userGroups = memberships.map(m => m.group_id);

                const pastBookings = await prisma.bookings.findMany({
                    where: { booker_user_id: userId, status: 'confirmed' },
                    include: { events: true }
                });
                pastAttendedCategories = pastBookings
                    .map(b => (b.events?.venue as any)?.meta?.category?.toLowerCase())
                    .filter(Boolean);

                const profile = await prisma.profiles.findUnique({
                    where: { user_id: userId },
                    select: { preferred_location: true }
                });
                userPreferredLocation = profile?.preferred_location || '';
            }

            const targetCity = city || userPreferredLocation;

            // Fetch upcoming published events
            const upcomingEvents = await prisma.events.findMany({
                where: {
                    status: 'published',
                    starts_at: { gt: new Date() }
                },
                include: {
                    ticket_types: true,
                    bookings: {
                        where: { status: 'confirmed' }
                    }
                }
            });

            // Filter to public events and calculate scores in memory
            const scoredEvents = await Promise.all(upcomingEvents
                .filter(ev => {
                    const venueObj = ev.venue as any;
                    const visibility = venueObj?.visibility;
                    return !visibility || visibility === 'public';
                })
                .map(async (ev) => {
                    const venueObj = ev.venue as any;
                    const meta = venueObj?.meta || {};
                    const evCategory = (meta.category || '').toLowerCase();
                    const titleText = ev.title.toLowerCase();
                    const venueText = (venueObj?.name || venueObj?.address || '').toLowerCase();

                    let score = 0;

                    // A. User Interest Match: +50
                    if (evCategory && userInterests.includes(evCategory)) {
                        score += 50;
                    }

                    // B. Hosted by joined group: +40
                    if (userGroups.includes(ev.hosted_by_entity_id)) {
                        score += 40;
                    }

                    // C. Attended category match: +30
                    if (evCategory && pastAttendedCategories.includes(evCategory)) {
                        score += 30;
                    }

                    // D. Location Match: +20
                    if (targetCity) {
                        const matchCity = targetCity.toLowerCase();
                        if (venueText.includes(matchCity) || titleText.includes(matchCity)) {
                            score += 20;
                        }
                    }

                    // E. Trending (booking count in last 7 days / overall): +10
                    if (ev.bookings.length > 10) {
                        score += 10;
                    }

                    // F. New event (created within last 3 days): +5
                    const threeDaysAgo = new Date();
                    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                    if (ev.created_at >= threeDaysAgo) {
                        score += 5;
                    }

                    // Enrich host info
                    const hostInfo = await EventService.resolveHostInfo(ev.hosted_by_entity_id).catch(() => ({
                        hostType: null, hostName: null, hostUserId: null, hostPhoto: null
                    }));
                    const wishlistCount = await prisma.event_wishlist.count({
                        where: { event_id: ev.id }
                    });
                    const isWishlisted = userId ? await prisma.event_wishlist.findUnique({
                        where: { event_id_user_id: { event_id: ev.id, user_id: userId } }
                    }).then(Boolean) : false;

                    return {
                        id: ev.id,
                        title: ev.title,
                        description: ev.description,
                        cover: meta.cover || null,
                        starts_at: ev.starts_at,
                        ends_at: ev.ends_at,
                        location_type: ev.location_type,
                        venue: venueObj?.name || venueObj?.address || null,
                        registration_mode: ev.registration_mode,
                        ticket_types: ev.ticket_types.map(t => {
                            const price = t.price_amount_minor ? Number(t.price_amount_minor) : 0;
                            return {
                                ...t,
                                price_amount_minor: price,
                                price_minor: price
                            };
                        }),
                        host: {
                            name: hostInfo.hostName,
                            photo: hostInfo.hostPhoto
                        },
                        wishlistCount,
                        isWishlisted,
                        score
                    };
                }));

            // Sort descending by score, apply pagination
            scoredEvents.sort((a, b) => b.score - a.score);
            const paginated = scoredEvents.slice(offset, offset + size);

            // Cache for 5 minutes
            setCached(cacheKey, paginated, 5 * 60 * 1000);
            return reply.send({ success: true, data: paginated });
        } catch (e: any) {
            fastify.log.error(e, 'GET /recommended-events failed');
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 3. GET /upcoming-events
    fastify.get('/upcoming-events', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) {
                return reply.send({ success: true, data: [] });
            }
            const userId = request.user.id;

            const bookings = await prisma.bookings.findMany({
                where: {
                    booker_user_id: userId,
                    status: { in: ['confirmed', 'pending_approval'] }
                },
                include: {
                    events: {
                        include: {
                            ticket_types: true
                        }
                    }
                }
            });

            const enriched = [];
            for (const b of bookings) {
                if (!b.events) continue;
                const startsAt = new Date(b.events.starts_at!).getTime();
                if (startsAt < Date.now() - 3600000) continue; // Skip events that ended more than 1 hour ago

                // Fetch attendee row with tickets to find QR token
                const attendee = await prisma.attendees.findFirst({
                    where: { booking_id: b.id, user_id: userId },
                    include: { tickets: true }
                });

                const endsAt = b.events.ends_at ? new Date(b.events.ends_at).getTime() : startsAt + 3600000;
                const now = Date.now();
                const isLive = now >= startsAt && now <= endsAt;

                const startDay = new Date(b.events.starts_at!).toDateString();
                const todayStr = new Date().toDateString();
                const isToday = startDay === todayStr;

                const countdownMs = startsAt - now;
                const venueObj = b.events.venue as any;

                enriched.push({
                    id: b.events.id,
                    title: b.events.title,
                    cover: venueObj?.meta?.cover || null,
                    starts_at: b.events.starts_at,
                    ends_at: b.events.ends_at,
                    bookingStatus: b.status,
                    isToday,
                    isLive,
                    countdown_ms: countdownMs > 0 ? countdownMs : 0,
                    qrToken: attendee?.tickets?.qr_token || null,
                    checkinStatus: attendee?.checkin_status || null
                });
            }

            // Sort soonest first
            enriched.sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());

            return reply.send({ success: true, data: enriched });
        } catch (e: any) {
            fastify.log.error(e, 'GET /upcoming-events failed');
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 4. GET /recent-discussions
    fastify.get('/recent-discussions', async (request: any, reply) => {
        try {
            const { limit = '10', page = '1' } = request.query as any;
            const size = parseInt(limit, 10);
            const offset = (parseInt(page, 10) - 1) * size;

            const userId = tryDecodeUserId(request);
            const safeUserId = userId || '00000000-0000-0000-0000-000000000000';

            // Query only forum posts from groups with visibility as public
            const posts: any[] = await prisma.$queryRawUnsafe(`
                SELECT
                    fp.id, fp.title, fp.body, fp.pinned, fp.locked, fp.solved, fp.archived,
                    fp.view_count, fp.status, fp.created_at, fp.updated_at, fp.deleted_at,
                    fp.author_user_id, fp.scope_type, fp.scope_id,
                    u.first_name, u.last_name, u.primary_email, u.profile_image_data,
                    g.name as group_name, g.icon as group_icon,
                    COALESCE(SUM(fv.vote), 0)::int AS vote_score,
                    (SELECT fv2.vote FROM forum_votes fv2 WHERE fv2.target_id = fp.id AND fv2.target_type = 'post' AND fv2.user_id = $1::uuid LIMIT 1) AS user_vote,
                    COUNT(DISTINCT fc.id)::int AS comments_count
                FROM forum_posts fp
                JOIN entities e ON e.id = fp.scope_id
                JOIN groups g ON g.entity_id = e.id
                LEFT JOIN users u ON u.id = fp.author_user_id
                LEFT JOIN forum_votes fv ON fv.target_id = fp.id AND fv.target_type = 'post'
                LEFT JOIN forum_comments fc ON fc.post_id = fp.id AND fc.deleted_at IS NULL
                WHERE fp.scope_type = 'group'
                  AND e.visibility = 'public'
                  AND fp.deleted_at IS NULL
                  AND fp.status = 'active'
                GROUP BY fp.id, u.first_name, u.last_name, u.primary_email, u.profile_image_data, g.name, g.icon
                ORDER BY fp.pinned DESC, fp.created_at DESC
                LIMIT $2 OFFSET $3
            `, safeUserId, size, offset);

            if (posts.length === 0) {
                return reply.send({ success: true, data: [] });
            }

            const postIds = posts.map(p => p.id);

            // Fetch reactions and tags in parallel queries
            const [reactions, tags] = await Promise.all([
                prisma.$queryRawUnsafe<any[]>(`
                    SELECT target_id, emoji, COUNT(*)::int AS cnt
                    FROM forum_reactions
                    WHERE target_id = ANY($1::uuid[]) AND target_type = 'post'
                    GROUP BY target_id, emoji
                `, postIds).catch(() => []),
                prisma.$queryRawUnsafe<any[]>(`
                    SELECT fpt.post_id, ft.id AS tag_id, ft.name, ft.color
                    FROM forum_post_tags fpt
                    JOIN forum_tags ft ON ft.id = fpt.tag_id
                    WHERE fpt.post_id = ANY($1::uuid[])
                `, postIds).catch(() => [])
            ]);

            const enriched = posts.map(post => {
                const postReactions = reactions.filter(r => r.target_id === post.id);
                const postTags = tags.filter(t => t.post_id === post.id);

                let authorPhoto: string | null = null;
                if (post.profile_image_data) {
                    authorPhoto = `data:image/jpeg;base64,${Buffer.from(post.profile_image_data).toString('base64')}`;
                }

                return {
                    id: post.id,
                    title: post.title,
                    body: post.body,
                    pinned: post.pinned,
                    locked: post.locked,
                    solved: post.solved,
                    archived: post.archived,
                    vote_score: post.vote_score,
                    user_vote: post.user_vote || 0,
                    comments_count: post.comments_count,
                    created_at: post.created_at,
                    author: {
                        name: `${post.first_name || ''} ${post.last_name || ''}`.trim() || 'Anonymous User',
                        photo: authorPhoto
                    },
                    group: {
                        id: post.scope_id,
                        name: post.group_name,
                        icon: post.group_icon
                    },
                    tags: postTags.map(t => ({ id: t.tag_id, name: t.name, color: t.color })),
                    reactions: postReactions.map(r => ({ emoji: r.emoji, count: r.cnt }))
                };
            });

            return reply.send({ success: true, data: enriched });
        } catch (e: any) {
            fastify.log.error(e, 'GET /recent-discussions failed');
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 5. GET /trending-groups
    fastify.get('/trending-groups', async (request: any, reply) => {
        try {
            const cacheKey = 'trending_groups';
            const cached = getCached(cacheKey);
            if (cached) return reply.send({ success: true, data: cached });

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Fetch public groups
            const groups = await prisma.groups.findMany({
                where: {
                    entities: {
                        visibility: 'public',
                        status: 'active'
                    }
                },
                include: {
                    entities: true,
                    group_invitations: true
                }
            });

            const scoredGroups = await Promise.all(groups.map(async (g) => {
                // A. New members in last 7 days
                const newMembersCount = await prisma.group_memberships.count({
                    where: {
                        group_id: g.entity_id,
                        state: 'active',
                        created_at: { gte: sevenDaysAgo }
                    }
                });

                // B. Forum posts in last 7 days
                const postsCount = await prisma.forum_posts.count({
                    where: {
                        scope_type: 'group',
                        scope_id: g.entity_id,
                        deleted_at: null,
                        created_at: { gte: sevenDaysAgo }
                    }
                });

                // C. Events created in last 7 days
                const eventsCount = await prisma.events.count({
                    where: {
                        hosted_by_entity_id: g.entity_id,
                        created_at: { gte: sevenDaysAgo }
                    }
                });

                // D. Total membership count
                const totalMembersCount = await prisma.group_memberships.count({
                    where: {
                        group_id: g.entity_id,
                        state: 'active'
                    }
                });

                // Score Formula
                const score = (newMembersCount * 3) + (postsCount * 2) + (eventsCount * 4) + (totalMembersCount * 1);

                return {
                    id: g.entity_id,
                    name: g.name,
                    slug: g.slug,
                    description: g.description,
                    icon: g.icon,
                    cover: g.cover,
                    category: g.category,
                    memberCount: totalMembersCount,
                    newMembersThisWeek: newMembersCount,
                    postsThisWeek: postsCount,
                    trendingScore: score
                };
            }));

            // Sort descending, take top 10
            scoredGroups.sort((a, b) => b.trendingScore - a.trendingScore);
            const trending = scoredGroups.slice(0, 10);

            // Cache for 10 minutes
            setCached(cacheKey, trending, 10 * 60 * 1000);
            return reply.send({ success: true, data: trending });
        } catch (e: any) {
            fastify.log.error(e, 'GET /trending-groups failed');
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 6. GET /nearby-communities
    fastify.get('/nearby-communities', async (request: any, reply) => {
        try {
            const { city = '', limit = '10' } = request.query as any;
            const size = parseInt(limit, 10);
            const userId = tryDecodeUserId(request);

            const cacheKey = `nearby_${userId || 'anon'}_${city}_${limit}`;
            const cached = getCached(cacheKey);
            if (cached) return reply.send({ success: true, data: cached });

            let refCityName = '';
            let refStateName = '';
            let refLat: number | null = null;
            let refLon: number | null = null;

            // Fetch reference location coords
            let locationSource = city;
            if (!locationSource && userId) {
                const profile = await prisma.profiles.findUnique({
                    where: { user_id: userId },
                    select: { preferred_location: true }
                });
                locationSource = profile?.preferred_location || '';
            }

            if (locationSource && locationSource !== 'Global') {
                const queryName = locationSource.split(',')[0].trim();
                const matchedCities = await prisma.$queryRawUnsafe<any[]>(
                    `SELECT city_name, state_name, latitude, longitude FROM city_controls WHERE city_name ILIKE $1 AND is_active = true LIMIT 1`,
                    queryName
                ).catch(() => []);
                const refLoc = matchedCities[0];
                if (refLoc) {
                    refCityName = refLoc.city_name;
                    refStateName = refLoc.state_name || '';
                    refLat = refLoc.latitude ? Number(refLoc.latitude) : null;
                    refLon = refLoc.longitude ? Number(refLoc.longitude) : null;
                }
            }

            // Fetch active public groups
            const groups = await prisma.groups.findMany({
                where: {
                    entities: {
                        visibility: 'public',
                        status: 'active'
                    }
                }
            });

            // Map and calculate geo proximity info
            const mappedGroups = await Promise.all(groups.map(async (g) => {
                const settingsObj = (g.settings as any) || {};
                const loc = settingsObj.location || (settingsObj.city ? { city: settingsObj.city } : null);
                
                let isSameCity = false;
                let isSameState = false;
                let distance: number | null = null;
                let hasLocation = false;

                if (loc && loc.city) {
                    hasLocation = true;
                    if (refCityName && loc.city.toLowerCase() === refCityName.toLowerCase()) {
                        isSameCity = true;
                    }
                    if (refStateName && loc.state && loc.state.toLowerCase() === refStateName.toLowerCase()) {
                        isSameState = true;
                    }
                    if (refLat !== null && refLon !== null && loc.lat !== undefined && loc.lon !== undefined) {
                        distance = getDistance(refLat, refLon, Number(loc.lat), Number(loc.lon));
                    }
                }

                const totalMembersCount = await prisma.group_memberships.count({
                    where: {
                        group_id: g.entity_id,
                        state: 'active'
                    }
                });

                return {
                    id: g.entity_id,
                    name: g.name,
                    slug: g.slug,
                    description: g.description,
                    icon: g.icon,
                    cover: g.cover,
                    category: g.category,
                    memberCount: totalMembersCount,
                    _isSameCity: isSameCity,
                    _isSameState: isSameState,
                    _distance: distance,
                    _hasLocation: hasLocation
                };
            }));

            // Proximity sort logic
            if (refCityName) {
                mappedGroups.sort((a, b) => {
                    if (a._isSameCity && !b._isSameCity) return -1;
                    if (!a._isSameCity && b._isSameCity) return 1;

                    if (a._distance !== null && b._distance !== null) return a._distance - b._distance;
                    if (a._distance !== null) return -1;
                    if (b._distance !== null) return 1;

                    if (a._isSameState && !b._isSameState) return -1;
                    if (!a._isSameState && b._isSameState) return 1;

                    if (a._hasLocation && !b._hasLocation) return -1;
                    if (!a._hasLocation && b._hasLocation) return 1;

                    return b.memberCount - a.memberCount;
                });
            } else {
                // Default fallback: most popular groups first
                mappedGroups.sort((a, b) => b.memberCount - a.memberCount);
            }

            const cleanResults = mappedGroups.slice(0, size).map(g => {
                const { _isSameCity, _isSameState, _distance, _hasLocation, ...rest } = g;
                return { ...rest, distance: _distance };
            });

            // Cache for 15 minutes
            setCached(cacheKey, cleanResults, 15 * 60 * 1000);
            return reply.send({ success: true, data: cleanResults });
        } catch (e: any) {
            fastify.log.error(e, 'GET /nearby-communities failed');
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 7. GET /people-you-may-know
    fastify.get('/people-you-may-know', async (request: any, reply) => {
        try {
            const userId = tryDecodeUserId(request);
            if (!userId) {
                return reply.send({ success: true, data: [] });
            }

            // A. Connection relationships to exclude
            const existingConnections = await prisma.connections.findMany({
                where: {
                    OR: [
                        { requester_user_id: userId },
                        { addressee_user_id: userId }
                    ]
                }
            });

            const excludedUserIds = new Set<string>();
            existingConnections.forEach(c => {
                excludedUserIds.add(c.requester_user_id);
                excludedUserIds.add(c.addressee_user_id);
            });
            excludedUserIds.add(userId);

            // B. Retrieve mutual scoring context
            const myGroups = await prisma.group_memberships.findMany({
                where: { user_id: userId, state: 'active' },
                select: { group_id: true }
            });
            const myGroupIds = myGroups.map(g => g.group_id);

            const myBookings = await prisma.bookings.findMany({
                where: { booker_user_id: userId, status: 'confirmed' },
                select: { event_id: true }
            });
            const myEventIds = myBookings.map(b => b.event_id);

            const myInterests = await prisma.user_interests.findMany({
                where: { user_id: userId },
                select: { category_id: true }
            });
            const myInterestIds = myInterests.map(i => i.category_id);

            const candidateUserIds = new Set<string>();

            // Find group peers
            if (myGroupIds.length > 0) {
                const groupPeers = await prisma.group_memberships.findMany({
                    where: { group_id: { in: myGroupIds }, state: 'active', user_id: { notIn: Array.from(excludedUserIds) } },
                    select: { user_id: true }
                });
                groupPeers.forEach(gp => candidateUserIds.add(gp.user_id));
            }

            // Find event peers
            if (myEventIds.length > 0) {
                const eventPeers = await prisma.bookings.findMany({
                    where: { event_id: { in: myEventIds }, status: 'confirmed', booker_user_id: { notIn: Array.from(excludedUserIds) } },
                    select: { booker_user_id: true }
                });
                eventPeers.forEach(ep => candidateUserIds.add(ep.booker_user_id));
            }

            // Find interest peers
            if (myInterestIds.length > 0) {
                const interestPeers = await prisma.user_interests.findMany({
                    where: { category_id: { in: myInterestIds }, user_id: { notIn: Array.from(excludedUserIds) } },
                    select: { user_id: true }
                });
                interestPeers.forEach(ip => candidateUserIds.add(ip.user_id));
            }

            // If candidates pool is small, supplement with recent active users
            if (candidateUserIds.size < 20) {
                const recentUsers = await prisma.users.findMany({
                    where: {
                        id: { notIn: Array.from(excludedUserIds) },
                        state: 'active'
                    },
                    orderBy: { id: 'desc' },
                    take: 20,
                    select: { id: true }
                });
                recentUsers.forEach(u => candidateUserIds.add(u.id));
            }

            if (candidateUserIds.size === 0) {
                return reply.send({ success: true, data: [] });
            }

            const candidatesList = Array.from(candidateUserIds);

            // C. Bulk fetch profiles and metadata for candidates
            const profiles = await prisma.profiles.findMany({
                where: { user_id: { in: candidatesList } }
            });

            const candidateMemberships = await prisma.group_memberships.findMany({
                where: { user_id: { in: candidatesList }, state: 'active' },
                select: { user_id: true, group_id: true, created_at: true }
            });

            const candidateBookings = await prisma.bookings.findMany({
                where: { booker_user_id: { in: candidatesList }, status: 'confirmed' },
                select: { booker_user_id: true, event_id: true }
            });

            const candidateInterests = await prisma.user_interests.findMany({
                where: { user_id: { in: candidatesList } },
                select: { user_id: true, category_id: true }
            });

            const myProfile = await prisma.profiles.findUnique({
                where: { user_id: userId }
            });

            const myHeadlineWords = (myProfile?.headline || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);

            // Compute connection scores
            const scoredCandidates = profiles.map(p => {
                const cId = p.user_id;
                let score = 0;

                // 1. Mutual Groups (Weight 5)
                const cGroupIds = candidateMemberships.filter(m => m.user_id === cId).map(m => m.group_id);
                const mutualGroups = cGroupIds.filter(id => myGroupIds.includes(id));
                score += mutualGroups.length * 5;

                // 2. Attended same events (Weight 4)
                const cEventIds = candidateBookings.filter(b => b.booker_user_id === cId).map(b => b.event_id);
                const mutualEvents = cEventIds.filter(id => myEventIds.includes(id));
                score += mutualEvents.length * 4;

                // 3. Matching interests (Weight 3)
                const cInterestIds = candidateInterests.filter(i => i.user_id === cId).map(i => i.category_id);
                const mutualInterests = cInterestIds.filter(id => myInterestIds.includes(id));
                score += mutualInterests.length * 3;

                // 4. Same org/college headline overlap (Weight 2)
                const cHeadline = (p.headline || '').toLowerCase();
                if (cHeadline && myHeadlineWords.length > 0) {
                    const hasOverlap = myHeadlineWords.some(word => cHeadline.includes(word));
                    if (hasOverlap) score += 2;
                }

                // 5. Recently joined same group (Weight 1)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const recentSameGroup = candidateMemberships.some(m =>
                    m.user_id === cId &&
                    myGroupIds.includes(m.group_id) &&
                    m.created_at >= sevenDaysAgo
                );
                if (recentSameGroup) score += 1;

                let profilePhoto: string | null = null;
                if (p.profile_image_data) {
                    profilePhoto = `data:image/jpeg;base64,${Buffer.from(p.profile_image_data).toString('base64')}`;
                }

                return {
                    id: cId,
                    name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Samaagum Member',
                    headline: p.headline || 'Member',
                    photo: profilePhoto,
                    location: p.preferred_location || null,
                    mutualGroupsCount: mutualGroups.length,
                    score
                };
            });

            // Sort by score descending and return top 10
            scoredCandidates.sort((a, b) => b.score - a.score);
            const results = scoredCandidates.slice(0, 10).map(c => {
                const { score, ...rest } = c;
                return rest;
            });

            return reply.send({ success: true, data: results });
        } catch (e: any) {
            fastify.log.error(e, 'GET /people-you-may-know failed');
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

};
