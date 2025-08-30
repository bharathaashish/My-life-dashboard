import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import DashboardGrid from './components/DashboardGrid';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <DashboardGrid />
      </main>
    </div>
  );
}

export default App;