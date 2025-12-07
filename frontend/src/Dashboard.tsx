import React, { useState, useEffect } from 'react';

interface Metric {
  metric_name: string;
  display_name: string;
  actual_value: number;
  annual_target: number;
  attainment_percent: number;
  metric_type: 'currency' | 'count' | 'percentage';
}

interface User {
  alias: string;
  name: string;
  job_title: string;
  staff_level: string;
  supervisor: string;
}

interface DashboardData {
  user_alias: string;
  user_name: string;
  job_title: string;
  staff_level: string;
  supervisor: string;
  metrics: Metric[];
}

// API endpoint - update with your actual Lambda API Gateway URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod';

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch dashboard data when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchDashboardData(selectedUser);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
      
      // Auto-select first user
      if (data.users.length > 0) {
        setSelectedUser(data.users[0].alias);
      }
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    }
  };

  const fetchDashboardData = async (userAlias: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/${userAlias}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number, type: Metric['metric_type']): string => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'count':
      default:
        return value.toLocaleString();
    }
  };

  const getAttainmentColor = (attainment: number): string => {
    if (attainment >= 100) return '#28a745'; // Green
    if (attainment >= 80) return '#ffc107';  // Yellow
    return '#dc3545'; // Red
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Performance Dashboard</h1>
      
      {/* User Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="user-select" style={{ marginRight: '10px' }}>
          Select User:
        </label>
        <select
          id="user-select"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            minWidth: '200px'
          }}
        >
          <option value="">-- Select a user --</option>
          {users.map((user) => (
            <option key={user.alias} value={user.alias}>
              {user.name} ({user.alias})
            </option>
          ))}
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading dashboard data...
        </div>
      )}

      {/* Dashboard Content */}
      {dashboardData && !loading && (
        <div>
          {/* User Info */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2>{dashboardData.user_name}</h2>
            <p><strong>Title:</strong> {dashboardData.job_title}</p>
            <p><strong>Level:</strong> {dashboardData.staff_level}</p>
            <p><strong>Manager:</strong> {dashboardData.supervisor}</p>
          </div>

          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {dashboardData.metrics.map((metric) => (
              <div
                key={metric.metric_name}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <h3 style={{ marginTop: 0, color: '#495057' }}>
                  {metric.display_name}
                </h3>
                
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                  {formatValue(metric.actual_value, metric.metric_type)}
                </div>
                
                <div style={{ marginBottom: '10px', color: '#6c757d' }}>
                  Target: {formatValue(metric.annual_target, metric.metric_type)}
                </div>
                
                {/* Progress Bar */}
                <div style={{
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  height: '8px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    backgroundColor: getAttainmentColor(metric.attainment_percent),
                    height: '100%',
                    borderRadius: '4px',
                    width: `${Math.min(metric.attainment_percent, 100)}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                
                <div style={{
                  fontSize: '14px',
                  color: getAttainmentColor(metric.attainment_percent),
                  fontWeight: 'bold'
                }}>
                  {metric.attainment_percent.toFixed(1)}% of target
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;