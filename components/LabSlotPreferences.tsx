import React from 'react';
import { Course } from '../types';
import { FlaskConical, Filter } from 'lucide-react';

interface Props {
  selectedCourses: Course[];
  labPreferences: { [courseCode: string]: string[] };
  onUpdateLabPreference: (courseCode: string, faculty: string) => void;
}

export const LabSlotPreferences: React.FC<Props> = ({ selectedCourses, labPreferences, onUpdateLabPreference }) => {
  // Filter courses that have lab sections and get unique lab faculty
  const coursesWithLabs = selectedCourses.map(course => {
    // Get unique faculty who teach labs for this course
    const labFaculties = new Set<string>();
    course.sections.forEach(s => {
      if (s.labSlot) {
        labFaculties.add(s.faculty);
      }
    });
    return {
      course,
      labFaculties: Array.from(labFaculties).sort()
    };
  }).filter(c => c.labFaculties.length > 0);

  if (coursesWithLabs.length === 0) return null;

  return (
    <div className="space-y-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <FlaskConical className="w-5 h-5 text-emerald-600" />
        Lab Faculty Preferences (Optional)
      </h2>
      <p className="text-sm text-slate-500">
        Select preferred lab faculty for each course. Leave empty to consider all available lab faculty.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {coursesWithLabs.map(({ course, labFaculties }) => {
          const selectedForThis = labPreferences[course.code] || [];

          return (
            <div key={course.code} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-medium text-slate-900">{course.title}</h3>
                  <p className="text-sm text-slate-500">{labFaculties.length} Lab Faculty Options Available</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Filter className="w-3 h-3" />
                  {selectedForThis.length === 0 ? "Any Lab Faculty" : `${selectedForThis.length} Selected`}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {labFaculties.map(faculty => {
                  const isActive = selectedForThis.includes(faculty);
                  return (
                    <button
                      key={faculty}
                      onClick={() => onUpdateLabPreference(course.code, faculty)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-all
                        ${isActive 
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 font-medium' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200'
                        }`}
                    >
                      {faculty}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
