import prisma from '../config/prisma';
import { decrypt, encrypt } from '../utils/encryption';
import { withProviderRollback } from '../utils/withProviderRollback';
import crypto from 'crypto';

export interface ProviderCapabilities {
  supportsUpdate: boolean;
  supportsDelete: boolean;
  supportsRecurring: boolean;
  supportsPassword: boolean;
}

export interface MeetingResult {
  provider: string;
  meetingId: string;
  joinUrl: string;
  hostUrl: string;
  calendarEventId?: string;
  conferenceId?: string;
  metadata: any;
}

export interface TokenResult {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface EventShape {
  title: string;
  description?: string | null;
  starts_at?: Date | null;
  ends_at?: Date | null;
  venue_timezone?: string | null;
}

export interface VirtualMeetingProvider {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;
  createMeeting(token: string, event: EventShape): Promise<MeetingResult>;
  updateMeeting(token: string, meetingId: string, event: EventShape, metadata: any): Promise<void>;
  deleteMeeting(token: string, meetingId: string, metadata: any): Promise<void>;
  refreshToken(refreshToken: string): Promise<TokenResult>;
}

class ZoomProvider implements VirtualMeetingProvider {
  readonly name = 'zoom';
  readonly capabilities: ProviderCapabilities = {
    supportsUpdate: true,
    supportsDelete: true,
    supportsRecurring: false,
    supportsPassword: true,
  };

  private getBasicAuthHeader() {
    const clientId = process.env.ZOOM_CLIENT_ID || '';
    const clientSecret = process.env.ZOOM_CLIENT_SECRET || '';
    return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  }

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': this.getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    if (!response.ok) {
      throw new Error(`Zoom token refresh failed: ${response.statusText}`);
    }
    return response.json() as any;
  }

  async createMeeting(token: string, event: EventShape): Promise<MeetingResult> {
    const startTime = event.starts_at ? event.starts_at.toISOString() : undefined;
    const duration = event.starts_at && event.ends_at ? Math.round((event.ends_at.getTime() - event.starts_at.getTime()) / 60000) : 60;
    
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: event.title,
        type: 2, // Scheduled meeting
        start_time: startTime,
        duration: duration,
        timezone: event.venue_timezone || 'UTC',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to create Zoom meeting: ${err}`);
    }

    const data: any = await response.json();
    return {
      provider: this.name,
      meetingId: data.id.toString(),
      joinUrl: data.join_url,
      hostUrl: data.start_url,
      metadata: {
        password: data.password,
        timezone: data.timezone,
        start_time: data.start_time,
        duration: data.duration,
        settings: data.settings,
        join_url: data.join_url,
        host_url: data.start_url
      }
    };
  }

  async updateMeeting(token: string, meetingId: string, event: EventShape, metadata: any): Promise<void> {
    const startTime = event.starts_at ? event.starts_at.toISOString() : undefined;
    const duration = event.starts_at && event.ends_at ? Math.round((event.ends_at.getTime() - event.starts_at.getTime()) / 60000) : undefined;
    
    const payload: any = {
      topic: event.title,
    };
    if (startTime) payload.start_time = startTime;
    if (duration) payload.duration = duration;
    if (event.venue_timezone) payload.timezone = event.venue_timezone;

    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok && response.status !== 404) {
      // Ignore 404s (meeting deleted externally)
      const err = await response.text();
      throw new Error(`Failed to update Zoom meeting: ${err}`);
    }
  }

  async deleteMeeting(token: string, meetingId: string, metadata: any): Promise<void> {
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok && response.status !== 404) {
      const err = await response.text();
      throw new Error(`Failed to delete Zoom meeting: ${err}`);
    }
  }
}

class GoogleProvider implements VirtualMeetingProvider {
  readonly name = 'google';
  readonly capabilities: ProviderCapabilities = {
    supportsUpdate: true,
    supportsDelete: true,
    supportsRecurring: false,
    supportsPassword: true,
  };

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '';
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    if (!response.ok) {
      throw new Error(`Google token refresh failed: ${response.statusText}`);
    }
    return response.json() as any;
  }

  async createMeeting(token: string, event: EventShape): Promise<MeetingResult> {
    const startTime = event.starts_at || new Date();
    const endTime = event.ends_at || new Date(startTime.getTime() + 60 * 60000);
    const requestId = crypto.randomUUID();

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description || '',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: event.venue_timezone || 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: event.venue_timezone || 'UTC',
        },
        conferenceData: {
          createRequest: {
            requestId: requestId,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to create Google Meet: ${err}`);
    }

    const data: any = await response.json();
    const conferenceData = data.conferenceData;
    let joinUrl = '';
    
    if (conferenceData && conferenceData.entryPoints) {
      const videoEntry = conferenceData.entryPoints.find((ep: any) => ep.entryPointType === 'video');
      if (videoEntry) joinUrl = videoEntry.uri;
    }

    if (!joinUrl) {
      throw new Error('Google API did not return a Meet link.');
    }

    return {
      provider: this.name,
      meetingId: data.id,
      calendarEventId: data.id,
      conferenceId: conferenceData?.conferenceId,
      joinUrl: joinUrl,
      hostUrl: joinUrl, // same for Google Meet
      metadata: {
        join_url: joinUrl,
        host_url: joinUrl,
        calendar_event_id: data.id,
        start_time: data.start.dateTime,
        end_time: data.end.dateTime
      }
    };
  }

  async updateMeeting(token: string, meetingId: string, event: EventShape, metadata: any): Promise<void> {
    const calendarEventId = metadata?.calendar_event_id || meetingId;
    if (!calendarEventId) return;

    const payload: any = {
      summary: event.title,
    };
    
    if (event.starts_at) {
      payload.start = { dateTime: event.starts_at.toISOString(), timeZone: event.venue_timezone || 'UTC' };
    }
    if (event.ends_at) {
      payload.end = { dateTime: event.ends_at.toISOString(), timeZone: event.venue_timezone || 'UTC' };
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok && response.status !== 404) {
      const err = await response.text();
      throw new Error(`Failed to update Google Meet: ${err}`);
    }
  }

  async deleteMeeting(token: string, meetingId: string, metadata: any): Promise<void> {
    const calendarEventId = metadata?.calendar_event_id || meetingId;
    if (!calendarEventId) return;

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok && response.status !== 404 && response.status !== 410) {
      // 410 Gone also means already deleted
      const err = await response.text();
      throw new Error(`Failed to delete Google Meet: ${err}`);
    }
  }
}

class VirtualMeetingServiceManager {
  private providers: Record<string, VirtualMeetingProvider> = {
    'zoom': new ZoomProvider(),
    'google': new GoogleProvider(),
  };

  getProvider(name: string): VirtualMeetingProvider {
    const provider = this.providers[name];
    if (!provider) throw new Error(`Unknown virtual meeting provider: ${name}`);
    return provider;
  }

  async getProviderStatus(userId: string): Promise<Record<string, boolean>> {
    const integrations = await prisma.user_integrations.findMany({
      where: { user_id: userId }
    });
    
    const status = { zoom: false, google: false };
    for (const integration of integrations) {
      if (integration.provider === 'zoom') status.zoom = true;
      if (integration.provider === 'google') status.google = true;
    }
    return status;
  }

  async ensureValidToken(userId: string, providerName: string): Promise<string> {
    const integration = await prisma.user_integrations.findUnique({
      where: { user_id_provider: { user_id: userId, provider: providerName } }
    });

    if (!integration) {
      throw new Error(`User has not connected provider: ${providerName}`);
    }

    const tokenInfo = {
      accessToken: decrypt(integration.access_token),
      refreshToken: integration.refresh_token ? decrypt(integration.refresh_token) : null,
      expiresAt: integration.expires_at
    };

    // If token expires in less than 5 minutes, refresh it
    if (tokenInfo.expiresAt && tokenInfo.expiresAt.getTime() < Date.now() + 5 * 60000) {
      if (!tokenInfo.refreshToken) {
         // Cannot refresh without refresh token, require re-auth
         await this.disconnectProvider(userId, providerName);
         throw new Error(`Token expired and no refresh token available for ${providerName}. Please reconnect.`);
      }

      const provider = this.getProvider(providerName);
      try {
        const result = await provider.refreshToken(tokenInfo.refreshToken);
        
        let newExpiresAt: Date | null = null;
        if (result.expires_in) {
          newExpiresAt = new Date(Date.now() + result.expires_in * 1000);
        }

        await prisma.user_integrations.update({
          where: { id: integration.id },
          data: {
            access_token: encrypt(result.access_token),
            refresh_token: result.refresh_token ? encrypt(result.refresh_token) : integration.refresh_token,
            expires_at: newExpiresAt,
            updated_at: new Date()
          }
        });

        return result.access_token;
      } catch (e: any) {
         console.warn(`Failed to refresh token for ${providerName}:`, e.message);
         // Clear integration so user is forced to reconnect
         await this.disconnectProvider(userId, providerName);
         throw new Error(`Failed to refresh token for ${providerName}. Please reconnect.`);
      }
    }

    return tokenInfo.accessToken;
  }

  async createMeeting(providerName: string, userId: string, eventId: string, event: EventShape) {
    const token = await this.ensureValidToken(userId, providerName);
    const provider = this.getProvider(providerName);

    return withProviderRollback(
      () => provider.createMeeting(token, event),
      async (result) => {
        await prisma.event_virtual_meetings.create({
          data: {
            event_id: eventId,
            provider: providerName,
            meeting_id: result.meetingId,
            calendar_event_id: result.calendarEventId,
            conference_id: result.conferenceId,
            metadata: result.metadata
          }
        });
      },
      async (result) => {
        await provider.deleteMeeting(token, result.meetingId, result.metadata);
      }
    );
  }

  async updateMeeting(providerName: string, userId: string, eventId: string, event: EventShape) {
    const meeting = await prisma.event_virtual_meetings.findUnique({
      where: { event_id_provider: { event_id: eventId, provider: providerName } }
    });
    if (!meeting || !meeting.meeting_id) return;

    const provider = this.getProvider(providerName);
    if (!provider.capabilities.supportsUpdate) return;

    let token: string;
    try {
      token = await this.ensureValidToken(userId, providerName);
    } catch (e) {
      console.warn(`Could not update meeting: user disconnected provider. Soft failing.`);
      return;
    }

    try {
      await provider.updateMeeting(token, meeting.meeting_id, event, meeting.metadata);
    } catch (e: any) {
      if (e.message.includes('404')) {
        await this.handleStaleMeeting(eventId);
      } else {
        throw e;
      }
    }
  }

  async deleteMeeting(providerName: string, userId: string, eventId: string) {
    const meeting = await prisma.event_virtual_meetings.findUnique({
      where: { event_id_provider: { event_id: eventId, provider: providerName } }
    });
    if (!meeting) return;

    let token: string | null = null;
    try {
      token = await this.ensureValidToken(userId, providerName);
    } catch (e) {
      console.warn(`Could not get valid token to delete meeting. Will just remove DB row.`);
    }

    if (token && meeting.meeting_id) {
      const provider = this.getProvider(providerName);
      if (provider.capabilities.supportsDelete) {
        try {
          await provider.deleteMeeting(token, meeting.meeting_id, meeting.metadata);
        } catch (e: any) {
          console.warn(`Failed to delete provider meeting for ${eventId}:`, e.message);
        }
      }
    }

    await prisma.event_virtual_meetings.delete({
      where: { id: meeting.id }
    });
  }

  async handleStaleMeeting(eventId: string) {
    // V2: background cleanup if a meeting is externally deleted
    const meeting = await prisma.event_virtual_meetings.findFirst({
      where: { event_id: eventId }
    });
    if (meeting) {
      console.warn(`Cleaning up stale meeting for event ${eventId}`);
      await prisma.event_virtual_meetings.delete({ where: { id: meeting.id } });
      await prisma.events.update({
        where: { id: eventId },
        data: { online_link: null }
      });
    }
  }

  async disconnectProvider(userId: string, providerName: string) {
    await prisma.user_integrations.deleteMany({
      where: { user_id: userId, provider: providerName }
    });
  }
}

export const VirtualMeetingService = new VirtualMeetingServiceManager();
