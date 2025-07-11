import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import AppointmentModal from '../components/Appointments/AppointmentModal';
import { useData } from '../contexts/DataContext';
import { formatDate, formatTime } from '../utils/dateUtils';

const AppointmentsPage = () => {
  const { incidents, patients, addIncident, updateIncident, deleteIncident, getPatientById } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(undefined);

  const filteredIncidents = incidents.filter(incident => {
    const patient = getPatientById(incident.patientId);
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    
    let matchesDate = true;
    const appointmentDate = new Date(incident.appointmentDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    if (dateFilter === 'today') {
      matchesDate = appointmentDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'tomorrow') {
      matchesDate = appointmentDate.toDateString() === tomorrow.toDateString();
    } else if (dateFilter === 'week') {
      matchesDate = appointmentDate >= today && appointmentDate <= nextWeek;
    } else if (dateFilter === 'overdue') {
      matchesDate = appointmentDate < today && incident.status === 'Scheduled';
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleAddIncident = () => {
    setSelectedIncident(undefined);
    setIsModalOpen(true);
  };

  const handleEditIncident = (incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const handleDeleteIncident = (incidentId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      deleteIncident(incidentId);
    }
  };

  const handleSaveIncident = (incidentData) => {
    if (selectedIncident) {
      updateIncident(selectedIncident.id, incidentData);
    } else {
      addIncident(incidentData);
    }
  };

  const handleQuickStatusUpdate = (incidentId, newStatus) => {
    updateIncident(incidentId, { status: newStatus });
  };

  const handleExportAppointments = () => {
    const csvContent = [
      ['Patient', 'Title', 'Date', 'Time', 'Status', 'Cost', 'Treatment'],
      ...filteredIncidents.map(incident => {
        const patient = getPatientById(incident.patientId);
        return [
          patient?.name || 'Unknown',
          incident.title,
          formatDate(incident.appointmentDate),
          formatTime(incident.appointmentDate),
          incident.status,
          incident.cost || 0,
          incident.treatment || ''
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointments_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Scheduled': return <Calendar className="w-4 h-4" />;
      case 'In Progress': return <Clock className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Calculate statistics
  const todayAppointments = incidents.filter(apt => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  }).length;

  const overdueAppointments = incidents.filter(apt => {
    const now = new Date();
    return new Date(apt.appointmentDate) < now && apt.status === 'Scheduled';
  }).length;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Appointments</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">Manage patient appointments and treatments</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleExportAppointments}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 
                dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white 
                dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={handleAddIncident}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium 
                rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 
                hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all 
                duration-300 transform hover:scale-105 hover:shadow-lg animate-pulse-glow w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Appointment Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{incidents.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Appointments</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{todayAppointments}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Today's Appointments</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {incidents.filter(apt => apt.status === 'Completed').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueAppointments}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Overdue</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 
        dark:border-gray-700 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative max-w-md flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 
                  bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none 
                  focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 
                  dark:text-white transition-all duration-300"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none 
                    focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 
                    dark:text-white transition-all duration-300"
                  >
                    <option value="all">All Status</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none 
                  focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 
                  dark:text-white transition-all duration-300"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="week">This Week</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredIncidents.map((incident, index) => {
                const patient = getPatientById(incident.patientId);
                return (
                  <div 
                    key={incident.id} 
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${300 + index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-md transition-all duration-300 hover:shadow-md">
                          <div className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 truncate">
                            {patient?.name || 'Unknown Patient'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{incident.title}</div>
                          {incident.description && (
                            <div className="text-sm text-gray-400 dark:text-gray-500 truncate">{incident.description}</div>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(incident.appointmentDate)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(incident.appointmentDate)}
                          </div>
                          <div>
                            <span className="font-medium">Cost:</span> {incident.cost ? `$${incident.cost.toFixed(2)}` : '-'}
                          </div>
                          <div>
                            <span className="font-medium">Files:</span> {incident.files.length}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(incident.status)} transition-all duration-300 hover:scale-105 flex items-center`}>
                            {getStatusIcon(incident.status)}
                            <span className="ml-1">{incident.status}</span>
                          </span>
                          <div className="flex space-x-1">
                            {incident.status === 'Scheduled' && (
                              <button
                                onClick={() => handleQuickStatusUpdate(incident.id, 'In Progress')}
                                className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors"
                              >
                                Start
                              </button>
                            )}
                            {incident.status === 'In Progress' && (
                              <button
                                onClick={() => handleQuickStatusUpdate(incident.id, 'Completed')}
                                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditIncident(incident)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 transform hover:scale-110 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteIncident(incident.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-all duration-300 transform hover:scale-110 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Patient & Treatment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quick Actions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredIncidents.map((incident, index) => {
                  const patient = getPatientById(incident.patientId);
                  return (
                    <tr 
                      key={incident.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 animate-fade-in-up"
                      style={{ animationDelay: `${300 + index * 100}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-md transition-all duration-300 hover:shadow-md">
                          <div className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                            {patient?.name || 'Unknown Patient'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{incident.title}</div>
                          {incident.description && (
                            <div className="text-sm text-gray-400 dark:text-gray-500 max-w-xs truncate">{incident.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(incident.appointmentDate)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTime(incident.appointmentDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(incident.status)} transition-all duration-300 hover:scale-105 flex items-center w-fit`}>
                          {getStatusIcon(incident.status)}
                          <span className="ml-1">{incident.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {incident.cost ? `$${incident.cost.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {incident.files.length} files
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {incident.status === 'Scheduled' && (
                            <button
                              onClick={() => handleQuickStatusUpdate(incident.id, 'In Progress')}
                              className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors"
                            >
                              Start
                            </button>
                          )}
                          {incident.status === 'In Progress' && (
                            <button
                              onClick={() => handleQuickStatusUpdate(incident.id, 'Completed')}
                              className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditIncident(incident)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 transform hover:scale-110 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteIncident(incident.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-all duration-300 transform hover:scale-110 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredIncidents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No appointments found</p>
            </div>
          )}
        </div>

        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveIncident}
          patients={patients}
          appointment={selectedIncident}
        />
      </div>
    </Layout>
  );
};

export default AppointmentsPage;