import { Course, Section, Timetable, TimeSlotMapping, ScheduledCourse } from '../types';

const parseTime = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Check if two slots overlap
const isOverlap = (slot1: string, slot2: string, slotTimings: TimeSlotMapping): boolean => {
  if (!slot1 || !slot2) return false;
  if (slot1 === slot2) return true;

  const times1 = slotTimings[slot1];
  const times2 = slotTimings[slot2];

  if (!times1 || !times2) return false;

  for (const t1 of times1) {
    for (const t2 of times2) {
      if (t1.day === t2.day) {
        const s1 = parseTime(t1.start);
        const e1 = parseTime(t1.end);
        const s2 = parseTime(t2.start);
        const e2 = parseTime(t2.end);

        if (s1 < e2 && s2 < e1) return true;
      }
    }
  }
  return false;
};

// Check if a slot conflicts with any in the occupied list
const hasSlotConflict = (slot: string, occupiedSlots: string[], slotTimings: TimeSlotMapping): boolean => {
  for (const occupied of occupiedSlots) {
    if (isOverlap(slot, occupied, slotTimings)) return true;
  }
  return false;
};

// Maximum number of timetables to generate - set high to get all possibilities
const MAX_TIMETABLES = 500;

// Extract unique theory options (faculty + slot combinations)
const getTheoryOptions = (sections: Section[]): { faculty: string; slot: string }[] => {
  const seen = new Set<string>();
  const options: { faculty: string; slot: string }[] = [];
  
  for (const section of sections) {
    // Key by faculty+slot to get unique combinations
    const key = `${section.faculty}-${section.theorySlot}`;
    if (!seen.has(key)) {
      seen.add(key);
      options.push({ faculty: section.faculty, slot: section.theorySlot });
    }
  }
  return options;
};

// Extract unique lab options with faculty information
const getLabOptions = (sections: Section[]): { faculty: string; slot: string }[] => {
  const seen = new Set<string>();
  const options: { faculty: string; slot: string }[] = [];
  
  for (const section of sections) {
    if (section.labSlot) {
      // Key by faculty+slot to track who teaches which lab slot
      const key = `${section.faculty}-${section.labSlot}`;
      if (!seen.has(key)) {
        seen.add(key);
        options.push({ faculty: section.faculty, slot: section.labSlot });
      }
    }
  }
  return options;
};

export const generateTimetables = (
  selectedCourses: Course[],
  facultyPreferences: { [courseCode: string]: string[] },
  slotTimings: TimeSlotMapping,
  labFacultyPreferences: { [courseCode: string]: string[] } = {}
): Timetable[] => {
  const validTimetables: Timetable[] = [];

  // Build course options with INDEPENDENT theory and lab choices
  const courseData = selectedCourses.map(course => {
    const preferredFaculty = facultyPreferences[course.code];
    const preferredLabFaculty = labFacultyPreferences[course.code];
    
    // For THEORY: apply faculty preference filter
    let theorySections = course.sections;
    if (preferredFaculty && preferredFaculty.length > 0) {
      theorySections = course.sections.filter(s => preferredFaculty.includes(s.faculty));
    }
    
    // Extract theory options from filtered sections
    let theoryOptions = getTheoryOptions(theorySections);
    
    // If faculty filter resulted in no theory options, fall back to all sections
    if (theoryOptions.length === 0) {
      theoryOptions = getTheoryOptions(course.sections);
    }

    // For LAB: get lab options with faculty info
    let labSections = course.sections.filter(s => s.labSlot);
    
    // Apply lab faculty preference filter if specified
    if (preferredLabFaculty && preferredLabFaculty.length > 0) {
      const filteredLabSections = labSections.filter(s => preferredLabFaculty.includes(s.faculty));
      // Only use filtered if it has results
      if (filteredLabSections.length > 0) {
        labSections = filteredLabSections;
      }
    }
    
    // Extract lab options (faculty + slot combinations)
    const labOptions = getLabOptions(labSections);
    const hasLab = labOptions.length > 0;

    return {
      code: course.code,
      theoryOptions,
      labOptions,  // Now includes faculty info
      hasLab
    };
  });

  // Check if any course has no theory options
  const coursesWithNoTheory = courseData.filter(c => c.theoryOptions.length === 0);
  if (coursesWithNoTheory.length > 0) {
    return [];
  }

  // Calculate total combinations
  let totalCombinations = 1;
  courseData.forEach(c => {
    totalCombinations *= c.theoryOptions.length;
    if (c.hasLab) {
      totalCombinations *= c.labOptions.length;
    }
  });

  // Use Set to track unique timetables and prevent duplicates
  const seenTimetables = new Set<string>();

  // Backtracking with independent theory and lab selection
  const backtrack = (
    courseIndex: number,
    currentSchedule: ScheduledCourse[],
    occupiedSlots: string[]
  ) => {
    if (validTimetables.length >= MAX_TIMETABLES) return;

    if (courseIndex === courseData.length) {
      // Create a unique key for this timetable to detect duplicates
      // Include both theory and lab faculty in the key
      const timetableKey = currentSchedule
        .map(sc => `${sc.courseCode}:${sc.theoryFaculty}:${sc.theorySlot}:${sc.labFaculty || 'none'}:${sc.labSlot || 'none'}`)
        .sort()
        .join('|');
      
      if (seenTimetables.has(timetableKey)) return;
      seenTimetables.add(timetableKey);

      // Convert to Section format - store lab faculty in a way that can be displayed
      const sections: Section[] = currentSchedule.map(sc => ({
        id: `${sc.courseCode}-${sc.theoryFaculty}-${sc.theorySlot}`,
        courseCode: sc.courseCode,
        faculty: sc.theoryFaculty,
        theorySlot: sc.theorySlot,
        labSlot: sc.labSlot,
        labFaculty: sc.labFaculty  // Add lab faculty to section
      }));

      validTimetables.push({
        id: validTimetables.length + 1,
        sections,
        scheduledCourses: [...currentSchedule]
      });
      return;
    }

    const course = courseData[courseIndex];

    // Try each theory option
    for (const theory of course.theoryOptions) {
      if (hasSlotConflict(theory.slot, occupiedSlots, slotTimings)) continue;

      if (!course.hasLab) {
        // No lab needed - just add theory
        backtrack(
          courseIndex + 1,
          [...currentSchedule, {
            courseCode: course.code,
            theorySlot: theory.slot,
            theoryFaculty: theory.faculty
          }],
          [...occupiedSlots, theory.slot]
        );
      } else {
        // Try each lab option INDEPENDENTLY (with faculty info)
        for (const lab of course.labOptions) {
          const newOccupied = [...occupiedSlots, theory.slot];
          
          if (hasSlotConflict(lab.slot, newOccupied, slotTimings)) continue;

          backtrack(
            courseIndex + 1,
            [...currentSchedule, {
              courseCode: course.code,
              theorySlot: theory.slot,
              theoryFaculty: theory.faculty,
              labSlot: lab.slot,
              labFaculty: lab.faculty  // Correct lab faculty from the data
            }],
            [...newOccupied, lab.slot]
          );
        }
      }
    }
  };

  backtrack(0, [], []);

  return validTimetables;
};