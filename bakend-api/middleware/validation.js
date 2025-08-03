const validateProducts = (req, res, next) => {
  const { products } = req.body;
  
  if (!products) {
    return res.status(400).json({ 
      error: 'Products array is required' 
    });
  }
  
  if (!Array.isArray(products)) {
    return res.status(400).json({ 
      error: 'Products must be an array' 
    });
  }
  
  if (products.length === 0) {
    return res.status(400).json({ 
      error: 'Products array cannot be empty' 
    });
  }
  
  // Validate each product is a string
  for (let i = 0; i < products.length; i++) {
    if (typeof products[i] !== 'string' || products[i].trim().length === 0) {
      return res.status(400).json({ 
        error: `Product at index ${i} must be a non-empty string` 
      });
    }
  }
  
  next();
};

const validateImageUpload = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      error: 'No image files uploaded' 
    });
  }
  
  // Validate file types
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  for (const file of req.files) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: `Invalid file type: ${file.originalname}. Only JPEG, PNG, and WebP are allowed.` 
      });
    }
  }
  
  next();
};

const validateAlternativeSearch = (req, res, next) => {
  const { image, productName, category, brand } = req.body;
  
  if (!image && (!productName || !category || !brand)) {
    return res.status(400).json({ 
      error: 'Either image or all of product name, category, and brand are required' 
    });
  }
  
  if (image && (productName || category || brand)) {
    return res.status(400).json({ 
      error: 'Cannot provide both image and text-based search parameters' 
    });
  }
  
  next();
};

module.exports = {
  validateProducts,
  validateImageUpload,
  validateAlternativeSearch
}; 