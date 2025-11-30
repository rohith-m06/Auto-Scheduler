import React from 'react';
import { Course } from '../types';
import { Users, Filter } from 'lucide-react';

interface Props {
  selectedCourses: Course[];
  preferences: { [courseCode: string]: string[] };
  onUpdatePreference: (courseCode: string, facultyName: string) => void;
}

export const FacultyPreferences: React.FC<Props> = ({ selectedCourses, preferences, onUpdatePreference }) => {
  if (selectedCourses.length === 0) return null;

  return (
    <div className="space-y-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Users className="w-5 h-5 text-purple-600" />
        Faculty Preferences (Optional)
      </h2>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {selectedCourses.map(course => {
          // Get unique faculties for this course
          const faculties = Array.from(new Set(course.sections.map(s => s.faculty)));
          const selectedForThis = preferences[course.code] || [];

          return (
            <div key={course.code} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-medium text-slate-900">{course.title}</h3>
                  <p className="text-sm text-slate-500">{faculties.length} Faculty Options Available</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Filter className="w-3 h-3" />
                    {selectedForThis.length === 0 ? "Any Faculty" : `${selectedForThis.length} Selected`}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {faculties.map(faculty => {
                  const isActive = selectedForThis.includes(faculty);
                  return (
                    <button
                      key={faculty}
                      onClick={() => onUpdatePreference(course.code, faculty)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-all
                        ${isActive 
                          ? 'bg-purple-100 text-purple-700 border-purple-200 font-medium' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-purple-200'
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
