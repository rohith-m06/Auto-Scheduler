import React from 'react';
import { Timetable, TimeSlotMapping } from '../types';
import { DAYS, THEORY_SLOTS, LAB_SLOTS } from '../constants';

interface Props {
  timetable: Timetable;
  slotTimings: TimeSlotMapping;
}

export const TimetableGrid: React.FC<Props> = ({ timetable, slotTimings }) => {
  const theorySlots = THEORY_SLOTS;
  const labSlots = LAB_SLOTS;

  const getCellData = (day: string, startTime: string, type: 'Theory' | 'Lab') => {
    const activeSection = timetable.sections.find(sec => {
      const slotCode = type === 'Theory' ? sec.theorySlot : sec.labSlot;
      if (!slotCode) return false;

      const timings = slotTimings[slotCode];
      return timings?.some(t => t.day === day && t.start === startTime);
    });

    if (!activeSection) return null;

    return {
      section: activeSection,
      slotName: type === 'Theory' ? activeSection.theorySlot : activeSection.labSlot
    };
  };

  // Color for theory cells based on course
  const getTheoryColor = (courseCode: string) => {
    const colors = ['#c7e9f1', '#d4edda', '#e2d9f3', '#fce8d0', '#f8d7da'];
    const index = courseCode.charCodeAt(courseCode.length - 1) % colors.length;
    return colors[index];
  };

  return (
    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', border: '1px solid #cbd5e1', overflow: 'hidden', margin: '16px 0' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #cbd5e1', background: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px', margin: 0 }}>Timetable Option {timetable.id}</h3>
        <div style={{ fontSize: '12px', color: '#475569' }}>{timetable.sections.length} courses</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
        <thead>
          {/* Row 1: Morning / Lunch / Afternoon headers */}
          <tr style={{ background: '#0a3d7a', color: 'white' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '60px' }}></th>
            <th colSpan={4} style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Morning</th>
            <th rowSpan={2} style={{ border: '1px solid #ccc', padding: '8px', width: '50px', background: '#d1d5db', color: '#333', fontWeight: 'bold', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Lunch</th>
            <th colSpan={4} style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Afternoon</th>
          </tr>
          {/* Row 2: Time slots */}
          <tr style={{ background: '#0a3d7a', color: 'white' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Day</th>
            {theorySlots.slice(0, 4).map((slot, i) => (
              <th key={i} style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'normal', fontSize: '11px' }}>{slot.label}</th>
            ))}
            {theorySlots.slice(4).map((slot, i) => (
              <th key={i + 4} style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'normal', fontSize: '11px' }}>{slot.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <React.Fragment key={day}>
              {/* Theory Row */}
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '10px', background: '#e6e6e6', fontWeight: 'bold', textAlign: 'center' }}>{day}</td>
                {theorySlots.slice(0, 4).map((slot) => {
                  const data = getCellData(day, slot.start, 'Theory');
                  return (
                    <td key={slot.start} style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      height: '70px',
                      background: data ? getTheoryColor(data.section.courseCode) : '#fdfdfd',
                    }}>
                      {data && (
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{data.slotName}</div>
                          <div>{data.section.courseCode}</div>
                          <div style={{ fontSize: '10px', color: '#666' }}>{data.section.faculty}</div>
                        </div>
                      )}
                    </td>
                  );
                })}
                <td rowSpan={2} style={{ border: '1px solid #ccc', background: '#d1d5db', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>LUNCH</td>
                {theorySlots.slice(4).map((slot) => {
                  const data = getCellData(day, slot.start, 'Theory');
                  return (
                    <td key={slot.start} style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      height: '70px',
                      background: data ? getTheoryColor(data.section.courseCode) : '#fdfdfd',
                    }}>
                      {data && (
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{data.slotName}</div>
                          <div>{data.section.courseCode}</div>
                          <div style={{ fontSize: '10px', color: '#666' }}>{data.section.faculty}</div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              {/* Lab Row */}
              <tr style={{ background: '#fef9c3' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px', background: '#e6e6e6', fontWeight: 'bold', textAlign: 'center', fontSize: '11px' }}>Lab</td>
                {labSlots.slice(0, 2).map((slot) => {
                  const data = getCellData(day, slot.start, 'Lab');
                  return (
                    <td key={slot.start} colSpan={2} style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      height: '60px',
                      background: data ? '#fef3c7' : '#fef9c3',
                    }}>
                      {data && (
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{data.slotName}</div>
                          <div>{data.section.courseCode}</div>
                          <div style={{ fontSize: '10px', color: '#666' }}>{data.section.labFaculty || data.section.faculty}</div>
                        </div>
                      )}
                    </td>
                  );
                })}
                {labSlots.slice(2).map((slot) => {
                  const data = getCellData(day, slot.start, 'Lab');
                  return (
                    <td key={slot.start} colSpan={2} style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      height: '60px',
                      background: data ? '#fef3c7' : '#fef9c3',
                    }}>
                      {data && (
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{data.slotName}</div>
                          <div>{data.section.courseCode}</div>
                          <div style={{ fontSize: '10px', color: '#666' }}>{data.section.labFaculty || data.section.faculty}</div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
