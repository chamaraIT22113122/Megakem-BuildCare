import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Switch, FormControlLabel, CircularProgress, Alert } from '@mui/material';
import { toast } from 'sonner';

export default function AdminMailTab({ token }: { token: string }) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/admin/settings/mail', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      enableMailSending: formData.get('enableMailSending') === 'on',
      ccEmails: formData.get('ccEmails'),
      mailFormatHtml: formData.get('mailFormatHtml')
    };

    try {
      const res = await fetch('http://localhost:5001/api/admin/settings/mail', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Settings updated successfully');
        setSettings(await res.json());
      } else {
        toast.error('Failed to save settings');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
        Mail Settings
      </Typography>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <form onSubmit={handleSave}>
          <FormControlLabel
            control={<Switch defaultChecked={settings?.enableMailSending} name="enableMailSending" color="primary" />}
            label="Enable Automated Order Approval Emails"
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="CC Emails (Comma separated)"
            name="ccEmails"
            defaultValue={settings?.ccEmails || ''}
            helperText="e.g. hr@megakemglobal.com, director@megakemglobal.com"
          />

          <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
            You can use the following variables in your HTML template:
            <br />
            <b>{'{managerName}'}</b>, <b>{'{employeeName}'}</b>, <b>{'{company}'}</b>, <b>{'{department}'}</b>, <b>{'{itemsHtml}'}</b>
          </Alert>

          <TextField
            fullWidth
            margin="normal"
            label="Email HTML Template"
            name="mailFormatHtml"
            multiline
            rows={10}
            defaultValue={settings?.mailFormatHtml || ''}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.9rem' } }}
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" size="large">
              Save Settings
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
