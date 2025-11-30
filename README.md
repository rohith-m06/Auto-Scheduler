# VIT AutoScheduler

An intelligent timetable generator for VIT students. Upload your course data, set preferences, and generate conflict-free timetables automatically.

## Features

- 📊 **Smart Data Import** - Upload PDF, Excel, or paste course data directly
- 🤖 **AI-Powered Analysis** - Gemini AI extracts course information automatically  
- ⚙️ **Faculty Preferences** - Set preferred faculty for theory and lab sections
- 📅 **Conflict-Free Generation** - Generates up to 50 valid timetables with no slot clashes
- ⭐ **Favorites System** - Save and compare your preferred schedules
- 💬 **AI Chat Analysis** - Get insights about your schedules with AI
- 📥 **Download** - Export timetables as VIT-styled HTML
- 🔐 **Cloud Sync** - Firebase authentication with session persistence

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS
- **AI**: Google Gemini 2.5 Flash
- **Backend**: Firebase (Auth + Firestore)
- **File Parsing**: PDF.js + XLSX

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Auth and Firestore enabled
- Google AI Studio API key


## Usage

1. **Sign Up/Login** - Create an account to save your data
2. **Upload Data** - Import your course list via PDF, Excel, or manual entry
3. **Select Courses** - Choose the courses you want to schedule
4. **Set Preferences** - Select preferred faculty for theory and lab sections
5. **Generate** - Click generate to create conflict-free timetables
6. **Analyze** - Use AI chat to get insights about your schedules
7. **Save Favorites** - Star your preferred timetables for easy access

