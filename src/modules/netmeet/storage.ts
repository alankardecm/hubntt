import fs from 'node:fs/promises';
import path from 'node:path';

export type NetMeetActionItem = {
  owner: string;
  task: string;
  due_date?: string | null;
  status: string;
};

export type NetMeetMeeting = {
  id: string;
  title: string;
  meetingLink: string;
  classification: string;
  transcript: string;
  summary: string;
  decisions: string[];
  risks: string[];
  nextSteps: string[];
  actionItems: NetMeetActionItem[];
  provider: string;
  publishedToTeams: boolean;
  createdAt: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), '.runtime', 'netmeet');
const DATA_FILE = path.join(DATA_DIR, 'meetings.json');

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ meetings: [] }, null, 2), 'utf8');
  }
}

export async function readMeetings() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw) as { meetings?: NetMeetMeeting[] };
  return parsed.meetings || [];
}

async function writeMeetings(meetings: NetMeetMeeting[]) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify({ meetings }, null, 2), 'utf8');
}

export async function createMeeting(input: {
  title: string;
  meetingLink: string;
  classification: string;
}) {
  const meetings = await readMeetings();
  const now = new Date().toISOString();
  const meeting: NetMeetMeeting = {
    id: `${Date.now()}`,
    title: input.title.trim() || 'Reuniao sem titulo',
    meetingLink: input.meetingLink.trim(),
    classification: input.classification.trim() || 'interno',
    transcript: '',
    summary: '',
    decisions: [],
    risks: [],
    nextSteps: [],
    actionItems: [],
    provider: 'pending',
    publishedToTeams: false,
    createdAt: now,
    updatedAt: now,
  };

  meetings.unshift(meeting);
  await writeMeetings(meetings);
  return meeting;
}

export async function updateMeeting(meetingId: string, updater: (meeting: NetMeetMeeting) => NetMeetMeeting) {
  const meetings = await readMeetings();
  const index = meetings.findIndex((meeting) => meeting.id === meetingId);
  if (index === -1) {
    throw new Error(`Reuniao ${meetingId} nao encontrada.`);
  }

  meetings[index] = {
    ...updater(meetings[index]),
    updatedAt: new Date().toISOString(),
  };

  await writeMeetings(meetings);
  return meetings[index];
}

export async function getMeeting(meetingId: string) {
  const meetings = await readMeetings();
  return meetings.find((meeting) => meeting.id === meetingId) || null;
}
