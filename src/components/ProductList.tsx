import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { productService } from '../lib/services';
import { Product } from '../types';
import { Plus, Search, Trash2, Edit2, Tag, DollarSign, Image as ImageIcon, Upload, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, resizeImage } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI } from '@google/genai';

interface ProductListProps {
  user: User;
}

export function ProductList({ user }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchProducts();
  }, [user.uid]);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await productService.getProducts(user.uid);
    setProducts(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await productService.deleteProduct(user.uid, id);
    setConfirmDeleteId(null);
    fetchProducts();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('settings.logoSizeError', 'Image size must be less than 5MB'));
        return;
      }
      try {
        const resized = await resizeImage(file, 800);
        setEditingProduct({ ...editingProduct, imageUrl: resized });
      } catch (err) {
        console.error("Resize error", err);
        alert(t('products.imageGenerateError', 'Error processing image.'));
      }
    }
  };

  const handleGenerateImage = async () => {
    if (!editingProduct?.name) {
      alert(t('products.imageGenerateNameRequired', 'Please enter a product name first to generate an image.'));
      return;
    }
    
    setGeneratingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A professional, realistic, high-quality product photography of "${editingProduct.name}". ${editingProduct.description || ''} Clean design, white background, good lighting.`,
            },
          ],
        },
      });
      
      let newImageUrl = null;
      if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            const rawDataUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
            newImageUrl = await resizeImage(rawDataUrl, 800);
            break;
          }
        }
      }
      
      if (newImageUrl) {
        setEditingProduct({ ...editingProduct, imageUrl: newImageUrl });
      } else {
        alert(t('products.imageGenerateFailed', 'Could not generate image. Please try again.'));
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      alert(t('products.imageGenerateError', 'Error generating image.') + " " + (error.message || ""));
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || editingProduct?.unitPrice === undefined) return;
    await productService.saveProduct(user.uid, editingProduct);
    setIsModalOpen(false);
    fetchProducts();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif text-[#1a1e1b] font-normal">{t('products.title')}</h1>
          <p className="text-natural-text/60 mt-1 font-sans">{t('products.subtitle')}</p>
        </div>
        <button
          onClick={() => { setEditingProduct({}); setIsModalOpen(true); }}
          className="btn-natural-primary shadow-lg shadow-natural-accent/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('products.newProduct')}
        </button>
      </div>

      <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-[0_4px_12px_rgba(61,74,64,0.05)]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99a19b]" />
          <input
            type="text"
            placeholder={t('products.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/30 outline-none transition-all font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">{t('common.loading')}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-16 text-natural-text/40 font-serif italic">{t('products.empty')}</div>
        ) : (
          filteredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-8 rounded-[32px] border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(61,74,64,0.08)] transition-all relative group flex flex-col min-h-[220px]"
            >
              <div className="flex justify-between items-start mb-6">
                {product.imageUrl ? (
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/5 overflow-hidden">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-natural-bg rounded-2xl flex items-center justify-center text-natural-sidebar">
                    <Tag className="w-7 h-7 opacity-60" />
                  </div>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                    className="p-2 text-[#99a19b] hover:text-natural-accent hover:bg-natural-accent/5 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  {confirmDeleteId === product.id ? (
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"
                    >
                      {t('common.delete')}?
                    </button>
                  ) : (
                    <button 
                      onClick={() => setConfirmDeleteId(product.id)}
                      className="p-2 text-[#99a19b] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-serif text-[#1a1e1b] text-2xl mb-2 font-normal line-clamp-1">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-[#7a827c] mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
                  {product.description}
                </p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                <span className="text-[10px] font-bold text-[#99a19b] uppercase tracking-widest">{t('products.baseRate').replace(' *', '')}</span>
                <span className="text-xl font-serif text-natural-text font-bold">{formatCurrency(product.unitPrice)}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-natural-sidebar/20 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl border border-black/5"
          >
            <h2 className="text-3xl font-serif text-[#1a1e1b] mb-8 font-normal">
              {editingProduct?.id ? t('products.editTitle') : t('products.newTitle')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-wider">{t('products.name')}</label>
                <input
                  required
                  type="text"
                  value={editingProduct?.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/30 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-wider">{t('products.baseRate')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99a19b] text-sm">$</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct?.unitPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/30 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-wider">{t('products.description')}</label>
                <textarea
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-4 py-3 bg-natural-bg/50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-natural-sage/30 outline-none"
                  rows={4}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#99a19b] uppercase tracking-wider">{t('products.image', 'Product Image')}</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-3 rounded-2xl bg-natural-bg/30 border border-black/5">
                  {editingProduct?.imageUrl ? (
                    <div className="relative group min-w-16">
                      <img src={editingProduct.imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-black/10 shadow-sm" />
                      <button 
                        type="button" 
                        onClick={() => setEditingProduct({ ...editingProduct, imageUrl: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-white border border-dashed border-black/10 rounded-xl flex items-center justify-center shadow-sm min-w-16">
                      <ImageIcon className="w-5 h-5 text-[#99a19b]/50" />
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="file"
                      id="product-image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label 
                      htmlFor="product-image-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/5 shadow-sm rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-xs font-medium text-natural-text"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {t('settings.uploadLogo', 'Upload Image')}
                    </label>
                    <button 
                      type="button"
                      onClick={handleGenerateImage}
                      disabled={generatingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity text-xs font-medium disabled:opacity-50"
                    >
                      {generatingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {generatingImage ? t('settings.generatingLogo', 'Generating...') : t('products.generateImage', 'AI Image')}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-100 rounded-xl font-medium text-[#7a827c] hover:bg-natural-bg transition-all"
                >
                  {t('products.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-natural-primary"
                >
                  {t('products.save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
