import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListFilter, Building2, PlusCircle, Radio, BarChart3 } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">
        <Radio size={24} />
        <span>EventRecording</span>
      </div>
      <nav className="nav-menu">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/events" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ListFilter size={20} />
          <span>Events Log</span>
        </NavLink>
        <NavLink to="/sites" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Building2 size={20} />
          <span>Sites List</span>
        </NavLink>
        <NavLink to="/submit" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PlusCircle size={20} />
          <span>Submit Event</span>
        </NavLink>
        <NavLink to="/live" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Radio size={20} />
          <span>Live Ticker</span>
        </NavLink>
        <NavLink to="/metrics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={20} />
          <span>Metrics</span>
        </NavLink>
      </nav>
    </aside>
  );
};
