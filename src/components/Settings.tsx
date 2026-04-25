import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { businessService } from '../lib/services';
import { BusinessProfile } from '../types';
import { Building2, Mail, MapPin, Globe, Loader2, Save, Image as ImageIcon, Upload, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LogoPosition } from '../types';
import { GoogleGenAI } from '@google/genai';
import { resizeImage } from '../lib/utils';

interface SettingsProps {
  user: User;
}

export function Settings({ user }: SettingsProps) {
  const [profile, setProfile] = useState<BusinessProfile>({
    name: '',
    email: user.email || '',
    address: '',
    taxId: '',
    currency: 'USD',
    logoPosition: 'top_left',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await businessService.getProfile(user.uid);
      if (data) setProfile({ ...profile, ...data });
      setLoading(false);
    };
    fetchProfile();
  }, [user.uid]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('settings.logoSizeError', 'Image size must be less than 5MB'));
        return;
      }
      try {
        const resized = await resizeImage(file, 400); // 400px wide is plenty for a logo
        setProfile({ ...profile, logoUrl: resized });
      } catch (err) {
        console.error("Resize error", err);
        alert(t('settings.logoGenerateError', 'Error processing image.'));
      }
    }
  };

  const [generatingLogo, setGeneratingLogo] = useState(false);

  const handleGenerateLogo = async () => {
    if (!profile.name) {
      alert(t('settings.logoGenerateNameRequired', 'Please enter a business name first to generate a logo.'));
      return;
    }
    
    setGeneratingLogo(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A professional, minimalistic, and modern logo for a company named "${profile.name}". Clean design, white background, corporate style.`,
            },
          ],
        },
      });
      
      let newLogoUrl = null;
      if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            const rawDataUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
            newLogoUrl = await resizeImage(rawDataUrl, 400); // compress generated image
            break;
          }
        }
      }
      
      if (newLogoUrl) {
        setProfile({ ...profile, logoUrl: newLogoUrl });
      } else {
        alert(t('settings.logoGenerateFailed', 'Could not generate logo. Please try again.'));
      }
    } catch (error: any) {
      console.error("Logo generation error:", error);
      alert(t('settings.logoGenerateError', 'Error generating logo.') + " " + (error.message || ""));
    } finally {
      setGeneratingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await businessService.saveProfile(user.uid, profile);
    setMessage(t('settings.success'));
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className="h-64 flex items-center justify-center text-natural-text/60 font-serif italic tracking-wide">{t('common.loading')}</div>;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-[#1a1e1b] font-normal tracking-tight">{t('settings.title')}</h1>
        <p className="text-natural-text/60 mt-1 font-sans">{t('settings.subtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 text-[#2d332f]">
        <div className="natural-card p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-widest ml-1 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 opacity-60" />
                {t('settings.businessName')}
              </label>
              <input
                required
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-5 py-4 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/20 outline-none transition-all font-sans"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-widest ml-1 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 opacity-60" />
                {t('settings.email')}
              </label>
              <input
                required
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-5 py-4 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/20 outline-none transition-all font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-widest ml-1">{t('settings.taxId')}</label>
              <input
                type="text"
                value={profile.taxId || ''}
                onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                className="w-full px-5 py-4 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/20 outline-none transition-all font-sans"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-widest ml-1">{t('settings.currency')}</label>
              <select
                value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                className="w-full px-5 py-4 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/20 outline-none transition-all cursor-pointer font-bold"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="DOP">DOP (RD$)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 border-t border-black/5 pt-8">
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-widest ml-1 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 opacity-60" />
                {t('settings.logo', 'Company Logo')}
              </label>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-natural-bg/20 p-6 rounded-[24px]">
                {profile.logoUrl ? (
                  <div className="relative group">
                    <img src={profile.logoUrl} alt="Logo" className="w-24 h-24 object-contain bg-white rounded-xl border border-black/5 p-2 shadow-sm" />
                    <button 
                      type="button" 
                      onClick={() => setProfile({ ...profile, logoUrl: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-white border border-dashed border-black/10 rounded-xl flex items-center justify-center shadow-sm">
                    <ImageIcon className="w-6 h-6 text-[#99a19b]/50" />
                  </div>
                )}
                
                <div className="flex-1 space-y-4">
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <label 
                        htmlFor="logo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/5 shadow-sm rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-natural-text"
                      >
                        <Upload className="w-4 h-4" />
                        {t('settings.uploadLogo', 'Upload Logo')}
                      </label>
                      <button 
                        type="button"
                        onClick={handleGenerateLogo}
                        disabled={generatingLogo}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50"
                      >
                        {generatingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {generatingLogo ? t('settings.generatingLogo', 'Generating...') : t('settings.generateLogo', 'Generate AI Logo')}
                      </button>
                    </div>
                    <p className="text-xs text-natural-text/50 mt-2 ml-1">{t('settings.logoRequirements', 'PNG, JPG, up to 1.5MB')}</p>
                  </div>
                  
                  <div className="max-w-xs space-y-2">
                    <label className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest">{t('settings.logoPosition', 'Logo Position (PDF)')}</label>
                    <select
                      value={profile.logoPosition || 'top_left'}
                      onChange={(e) => setProfile({ ...profile, logoPosition: e.target.value as LogoPosition })}
                      className="w-full px-4 py-3 bg-white border border-black/5 rounded-xl focus:ring-2 focus:ring-natural-sage/20 outline-none transition-all cursor-pointer text-sm shadow-sm"
                    >
                      <option value="top_left">{t('settings.position.topLeft', 'Top Left')}</option>
                      <option value="top_center">{t('settings.position.topCenter', 'Top Center')}</option>
                      <option value="top_right">{t('settings.position.topRight', 'Top Right')}</option>
                      <option value="bottom_left">{t('settings.position.bottomLeft', 'Bottom Left')}</option>
                      <option value="bottom_center">{t('settings.position.bottomCenter', 'Bottom Center')}</option>
                      <option value="bottom_right">{t('settings.position.bottomRight', 'Bottom Right')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-black/5 pt-8">
            <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-widest ml-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 opacity-60" />
              {t('settings.address')}
            </label>
            <textarea
              value={profile.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder={t('settings.addressPlaceholder')}
              rows={4}
              className="w-full px-6 py-5 bg-natural-bg/50 border border-transparent rounded-[24px] focus:bg-white focus:ring-2 focus:ring-natural-sage/20 outline-none transition-all font-sans resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex-1">
            {message && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-natural-accent font-serif italic text-sm"
              >
                {message}
              </motion.span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-natural-primary shadow-xl shadow-natural-accent/20 px-10 py-5 text-lg flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
