// A section now represents a single faculty offering with EITHER theory OR lab
// Theory and Lab are independent - same faculty might offer both but they're separate choices
export interface Section {
  id: string; // Unique ID for this specific offering (e.g., "DSA-Monit-B1")
  courseCode: string;
  faculty: string;  // Theory faculty
  theorySlot: string;
  labSlot?: string; // Optional, some courses are theory only
  labFaculty?: string; // Lab faculty (can be different from theory faculty)
}

// New: Separate representation for independent theory/lab selection
export interface TheoryOption {
  id: string;
  courseCode: string;
  faculty: string;
  slot: string; // e.g., "A1", "B2"
}

export interface LabOption {
  id: string;
  courseCode: string;
  faculty: string;
  slot: string; // e.g., "L1+L2", "L25+L26"
}

export interface Course {
  code: string;
  title: string;
  credits: number;
  sections: Section[];
  // New: Separate arrays for independent selection
  theoryOptions?: TheoryOption[];
  labOptions?: LabOption[];
  hasLab?: boolean; // Whether this course requires a lab
}

export interface ScheduledCourse {
  courseCode: string;
  theorySlot: string;
  theoryFaculty: string;
  labSlot?: string;
  labFaculty?: string;
}

export interface Timetable {
  id: number;
  sections: Section[];
  // New: More detailed schedule
  scheduledCourses?: ScheduledCourse[];
  // For favorites
  savedAt?: string;
  name?: string;
}

export interface SavedTimetable extends Timetable {
  savedAt: string;
  name: string;
  totalCredits: number;
  courseCount: number;
}

export interface TimeSlotMapping {
  [key: string]: { day: string; start: string; end: string }[];
}

export enum ViewState {
  LANDING,
  UPLOAD,
  SELECTION,
  GENERATING,
  RESULTS,
  FAVORITES
}
