import { supabase } from './supabase';

// Reports table: id, disaster_type, title, description, location, latitude, longitude, severity, status, evidence_urls, created_at, user_id, verification_notes
// severity: 'High' | 'Medium' | 'Low'
// status: 'pending' | 'verified' | 'rejected'
// disaster_type: 'Flood' | 'Heavy Rainfall' | 'Cyclone' | 'Earthquake' | 'Landslide' | 'Heatwave' | 'Other'

export const DISASTER_TYPES = ['Flood', 'Heavy Rainfall', 'Cyclone', 'Earthquake', 'Landslide', 'Heatwave', 'Other'];
export const SEVERITIES = ['High', 'Medium', 'Low'];
export const STATUSES = ['pending', 'verified', 'rejected'];

export const getReports = async (filters = {}) => {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.disaster_type && filters.disaster_type !== 'All') {
    query = query.eq('disaster_type', filters.disaster_type);
  }
  if (filters.severity && filters.severity !== 'All') {
    query = query.eq('severity', filters.severity);
  }
  if (filters.status && filters.status !== 'All') {
    query = query.eq('status', filters.status);
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getReportById = async (id) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const getMyReports = async (userId) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createReport = async (reportData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to submit a report.');

  const { data, error } = await supabase
    .from('reports')
    .insert([{
      ...reportData,
      user_id: user.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateReportStatus = async (reportId, status, verificationNotes) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('reports')
    .update({
      status,
      verification_notes: verificationNotes,
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const uploadEvidence = async (file, reportId) => {
  const ext = file.name.split('.').pop();
  const fileName = `${reportId || Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
  const filePath = `evidence/${fileName}`;

  const { error } = await supabase.storage
    .from('disaster-evidence')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('disaster-evidence')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const getDashboardStats = async () => {
  const { data: allReports, error } = await supabase
    .from('reports')
    .select('status, disaster_type, created_at, user_id');

  if (error) throw error;

  const reports = allReports || [];
  const total = reports.length;
  const verified = reports.filter(r => r.status === 'verified').length;
  const pending = reports.filter(r => r.status === 'pending').length;
  const rejected = reports.filter(r => r.status === 'rejected').length;
  const contributors = new Set(reports.map(r => r.user_id)).size;

  return { total, verified, pending, rejected, contributors };
};

export const getUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'citizen';
  
  // Check user_roles table or user metadata
  const role = user.user_metadata?.role || 'citizen';
  return role;
};
