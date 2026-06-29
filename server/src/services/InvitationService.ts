import prisma from '../config/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

interface InviteTarget {
    email?: string;
    username?: string;
}

export class InvitationService {

    // Helper to generate a random token
    private static generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Create individual single-use invitations for a list of emails or usernames.
     */
    static async createInvitations(groupId: string, inviterId: string, targets: InviteTarget[]) {
        const results = [];
        
        for (const target of targets) {
            // Check if user is already a member
            let existingUser = null;
            if (target.email) {
                existingUser = await prisma.users.findFirst({ where: { primary_email: target.email } });
            } else if (target.username) {
                const p = await prisma.profiles.findFirst({ where: { user_name: target.username } });
                if (p) existingUser = await prisma.users.findFirst({ where: { id: p.user_id } });
            }

            if (existingUser) {
                const membership = await prisma.group_memberships.findUnique({
                    where: { group_id_user_id: { group_id: groupId, user_id: existingUser.id } }
                });
                if (membership && membership.state === 'active') {
                    results.push({ target, success: false, message: 'Already a member' });
                    continue;
                }
            }

            // Check for existing pending invitation
            const existingInvite = await prisma.group_invitations.findFirst({
                where: {
                    group_id: groupId,
                    status: 'pending',
                    OR: [
                        { email: target.email || undefined },
                        { username: target.username || undefined }
                    ]
                }
            });

            if (existingInvite) {
                results.push({ target, success: false, message: 'Invitation already pending' });
                continue;
            }

            const token = this.generateToken();
            const invite = await prisma.group_invitations.create({
                data: {
                    group_id: groupId,
                    email: target.email || null,
                    username: target.username || null,
                    token,
                    status: 'pending',
                    link_type: 'single_use',
                    invited_by: inviterId
                }
            });

            const inviteLink = `${process.env.APP_URL || 'http://app.samaagum.com'}/groups/invite/${token}`;
            if (process.env.SMTP_HOST) {
                try {
                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST,
                        port: parseInt(process.env.SMTP_PORT || '587'),
                        secure: process.env.SMTP_SECURE === 'true',
                        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                    });
                    await transporter.sendMail({
                        from: process.env.SMTP_FROM || 'noreply@samaagum.com',
                        to: target.email || '',
                        subject: "You've been invited to join a group on Samaagum",
                        html: `<p>You have been invited to join a group on Samaagum.</p><p>Click the link below to accept your invitation:</p><p><a href="${inviteLink}">${inviteLink}</a></p><p>This link is for your use only and will expire after one use.</p>`
                    });
                } catch (emailErr) {
                    console.error('[Email] Failed to send invite email:', emailErr);
                }
            } else {
                console.log(`[Email Mock] Invite for ${target.email || target.username}: ${inviteLink}`);
            }

            results.push({ target, success: true, token });
        }
        
        return results;
    }

    /**
     * Create a shareable invite link with configurable constraints.
     */
    static async createShareableLink(groupId: string, inviterId: string, config: { maxUses?: number, expiryHours?: number }) {
        const token = this.generateToken();
        const expiresAt = config.expiryHours ? new Date(Date.now() + config.expiryHours * 60 * 60 * 1000) : null;
        
        const invite = await prisma.group_invitations.create({
            data: {
                group_id: groupId,
                token,
                status: 'pending',
                link_type: config.maxUses === 1 ? 'single_use' : 'multi_use',
                max_uses: config.maxUses || null,
                expires_at: expiresAt,
                invited_by: inviterId
            }
        });

        return invite;
    }

    /**
     * Validate an invitation token
     */
    static async validateInvite(token: string, userId?: string) {
        const invite = await prisma.group_invitations.findUnique({
            where: { token },
            include: { groups: true, users: true }
        });

        if (!invite) return { valid: false, message: 'Invalid invitation token' };
        if (invite.status === 'revoked') return { valid: false, message: 'Invitation was revoked' };
        if (invite.status === 'expired' || (invite.expires_at && invite.expires_at < new Date())) {
            // Update status to expired
            if (invite.status !== 'expired') {
                await prisma.group_invitations.update({ where: { id: invite.id }, data: { status: 'expired' } });
            }
            return { valid: false, message: 'Invitation has expired' };
        }
        if (invite.status === 'accepted' && invite.link_type === 'single_use') {
            return { valid: false, message: 'Invitation has already been used' };
        }
        if (invite.max_uses && invite.uses_count >= invite.max_uses) {
            return { valid: false, message: 'Invitation has reached maximum uses' };
        }

        // If target-specific, ensure the logged-in user matches the target
        if (userId) {
            const user = await prisma.users.findUnique({ where: { id: userId } });
            if (!user) return { valid: false, message: 'User not found' };

            if (invite.email && invite.email !== user.primary_email) {
                return { valid: false, message: 'This invitation is for a different email address' };
            }
            if (invite.username) {
                const profile = await prisma.profiles.findFirst({ where: { user_id: userId } });
                if (!profile || invite.username !== profile.user_name) {
                    return { valid: false, message: 'This invitation is for a different username' };
                }
            }

            // Check if user is already a member
            const membership = await prisma.group_memberships.findUnique({
                where: { group_id_user_id: { group_id: invite.group_id, user_id: userId } }
            });
            if (membership && membership.state === 'active') {
                return { valid: false, message: 'You are already a member of this group' };
            }
        }

        return { valid: true, invite };
    }

    /**
     * Accept an invitation and provision membership.
     * Respects join_mode === 'approval' (creates pending membership)
     * and questionnaires (requires answers before creating membership).
     */
    static async acceptInvite(token: string, userId: string, tenantId: string, answers: Record<string, any> = {}) {
        const validation = await this.validateInvite(token, userId);
        if (!validation.valid || !validation.invite) {
            throw new Error(validation.message || 'Invalid invitation');
        }

        const invite = validation.invite;
        const group = (invite as any).groups;

        if (!group) throw new Error('Group not found');

        const groupSettings = (group.settings as any) || {};
        const questionnaires: any[] = groupSettings.questionnaires || [];

        // If group requires questionnaire answers and none were provided, signal the frontend
        if (questionnaires.length > 0 && (!answers || Object.keys(answers).length === 0)) {
            return { requiresQuestionnaire: true as const, groupId: invite.group_id, questionnaires };
        }

        const needsApproval = group.join_mode === 'approval';
        const memberState = needsApproval ? 'pending' : 'active';

        const result = await prisma.$transaction(async (tx) => {
            const answersData = (answers && Object.keys(answers).length > 0) ? (answers as any) : undefined;

            const membership = await tx.group_memberships.upsert({
                where: { group_id_user_id: { group_id: invite.group_id, user_id: userId } },
                update: {
                    state: memberState as any,
                    ...(memberState === 'active' ? { joined_at: new Date() } : {}),
                    ...(answersData ? { answers: answersData } : {})
                },
                create: {
                    tenant_id: tenantId,
                    group_id: invite.group_id,
                    user_id: userId,
                    state: memberState as any,
                    ...(memberState === 'active' ? { joined_at: new Date() } : {}),
                    ...(answersData ? { answers: answersData } : {})
                }
            });

            // Update invitation uses
            const newUsesCount = invite.uses_count + 1;
            let newStatus = invite.status;

            if (invite.link_type === 'single_use' || (invite.max_uses && newUsesCount >= invite.max_uses)) {
                newStatus = 'accepted';
            }

            await tx.group_invitations.update({
                where: { id: invite.id },
                data: {
                    uses_count: newUsesCount,
                    status: newStatus,
                    accepted_at: new Date()
                }
            });

            return { membership, inviteGroupId: invite.group_id };
        });

        return { ...result, membershipState: memberState };
    }
}
