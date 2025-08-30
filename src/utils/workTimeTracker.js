// Utility for tracking daily work time from Pomodoro sessions

export class WorkTimeTracker {
  static STORAGE_KEY = 'daily-work-time';

  // Get work time data for all dates
  static getAllWorkTime() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  // Get work time for a specific date (YYYY-MM-DD format)
  static getWorkTimeForDate(dateString) {
    const allData = this.getAllWorkTime();
    return allData[dateString] || 0; // Returns milliseconds
  }

  // Add work time for a specific date
  static addWorkTime(dateString, milliseconds) {
    const allData = this.getAllWorkTime();
    allData[dateString] = (allData[dateString] || 0) + milliseconds;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('workTimeUpdated', {
      detail: { date: dateString, totalTime: allData[dateString] }
    }));
  }

  // Set work time for a specific date (overwrites existing)
  static setWorkTimeForDate(dateString, milliseconds) {
    const allData = this.getAllWorkTime();
    allData[dateString] = milliseconds;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('workTimeUpdated', {
      detail: { date: dateString, totalTime: milliseconds }
    }));
  }

  // Get today's date string in YYYY-MM-DD format (local timezone)
  static getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get date string for any date in YYYY-MM-DD format (local timezone)
  static getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format milliseconds to human-readable time
  static formatTime(milliseconds) {
    const totalMinutes = Math.floor(milliseconds / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Get work time summary for a date range
  static getWorkTimeSummary(startDate, endDate) {
    const allData = this.getAllWorkTime();
    const summary = {};
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateString = this.getDateString(date);
      const workTime = allData[dateString] || 0;
      if (workTime > 0) {
        summary[dateString] = workTime;
      }
    }
    
    return summary;
  }

  // Clear all work time data
  static clearAllData() {
    localStorage.removeItem(this.STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('workTimeUpdated', {
      detail: { cleared: true }
    }));
  }

  // Get total work time for current week
  static getWeeklyTotal() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    
    const summary = this.getWorkTimeSummary(
      this.getDateString(startOfWeek),
      this.getDateString(endOfWeek)
    );
    
    return Object.values(summary).reduce((total, time) => total + time, 0);
  }

  // Get total work time for current month
  static getMonthlyTotal() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const summary = this.getWorkTimeSummary(
      this.getDateString(startOfMonth),
      this.getDateString(endOfMonth)
    );
    
    return Object.values(summary).reduce((total, time) => total + time, 0);
  }

  // Debug function to check current date and stored data
  static debugInfo() {
    const today = this.getTodayDateString();
    const todayWorkTime = this.getWorkTimeForDate(today);
    const allData = this.getAllWorkTime();
    
    console.log('WorkTimeTracker Debug Info:');
    console.log('Today\'s date:', today);
    console.log('Today\'s work time:', this.formatTime(todayWorkTime));
    console.log('All stored work time data:', allData);
    
    return {
      today,
      todayWorkTime,
      allData
    };
  }
}