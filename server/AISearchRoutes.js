/**
 * AI Search Routes - مسارات البحث بالذكاء الاصطناعي
 * تضاف إلى server.js
 */

import AISearchService from './AISearchService.js';

/**
 * تضاف هذه المسارات إلى server.js بعد استيراد AISearchService
 */

export function setupAISearchRoutes(app) {
  
  // ==================== AI SEARCH ROUTES ====================

  /**
   * البحث عن أداة طبية
   * GET /api/ai-search/instrument?name=اسم_الأداة
   */
  app.get('/api/ai-search/instrument', async (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'اسم الأداة مطلوب'
        });
      }

      const result = await AISearchService.searchInstrument(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في البحث عن الأداة',
        error: error.message
      });
    }
  });

  /**
   * البحث المتقدم عن أداة مع معلومات طبية
   * GET /api/ai-search/advanced?name=اسم_الأداة
   */
  app.get('/api/ai-search/advanced', async (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'اسم الأداة مطلوب'
        });
      }

      const result = await AISearchService.advancedMedicalSearch(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في البحث المتقدم',
        error: error.message
      });
    }
  });

  /**
   * البحث عن صور الأداة
   * GET /api/ai-search/images?name=اسم_الأداة
   */
  app.get('/api/ai-search/images', async (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'اسم الأداة مطلوب'
        });
      }

      const images = await AISearchService.searchImages(name);
      res.json({
        success: true,
        data: images
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في البحث عن الصور',
        error: error.message
      });
    }
  });

  /**
   * البحث عن بدائل للأداة
   * GET /api/ai-search/alternatives?name=اسم_الأداة
   */
  app.get('/api/ai-search/alternatives', async (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'اسم الأداة مطلوب'
        });
      }

      const result = await AISearchService.findAlternatives(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في البحث عن البدائل',
        error: error.message
      });
    }
  });

  /**
   * إضافة أداة مع البحث التلقائي عن معلوماتها
   * POST /api/ai-search/add-with-info
   * Body: { deptCode, listId, name, code, quantity, status }
   */
  app.post('/api/ai-search/add-with-info', async (req, res) => {
    try {
      const { deptCode, listId, name, code, quantity, status } = req.body;
      
      if (!deptCode || !listId || !name || !code) {
        return res.status(400).json({
          success: false,
          message: 'جميع الحقول مطلوبة'
        });
      }

      // البحث عن معلومات الأداة
      const searchResult = await AISearchService.searchInstrument(name);
      
      // الحصول على أول صورة متاحة
      let imageUrl = null;
      if (searchResult.success && searchResult.data.images.length > 0) {
        imageUrl = searchResult.data.images[0].url;
      }

      // إنشاء الأداة مع المعلومات
      const newEquipment = {
        deptCode,
        listId,
        name: name.trim(),
        code: code.trim(),
        quantity: parseInt(quantity) || 0,
        status: status || 'Available',
        image: imageUrl,
        aiSearchInfo: {
          description: searchResult.data?.description || '',
          sources: searchResult.data?.sources || [],
          searchedAt: new Date()
        },
        createdAt: new Date(),
        createdBy: 'admin'
      };

      res.status(201).json({
        success: true,
        message: 'تم إضافة الأداة مع المعلومات',
        data: newEquipment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في إضافة الأداة',
        error: error.message
      });
    }
  });

  console.log('✅ AI Search Routes تم تحميلها بنجاح');
}

export default setupAISearchRoutes;
