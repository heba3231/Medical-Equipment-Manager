/**
 * AI Instrument Search Component
 * AIInstrumentSearch.js
 */

import React, { useState } from 'react';

const AIInstrumentSearch = ({ onSelectInstrument }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info'); // info, images, alternatives
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [alternativesLoaded, setAlternativesLoaded] = useState(false);

  /**
   * Search for instrument
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter an instrument name');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults(null);
    setImagesLoaded(false);
    setAlternativesLoaded(false);

    const API_BASE = `http://${window.location.hostname}:5000/api`;
    try {
      const response = await fetch(
        `${API_BASE}/ai-search/instrument?name=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.success) {
        // Ensure all required fields exist
        const safeData = {
          name: data.data?.name || searchQuery,
          description: data.data?.description || `Information about medical instrument: ${searchQuery}`,
          sources: data.data?.sources || [],
          images: data.data?.images || [],
          alternatives: data.data?.alternatives || []
        };
        setSearchResults(safeData);
        
        // Load images and alternatives separately if not present
        if (safeData.images.length === 0) {
          fetchImages(searchQuery);
        } else {
          setImagesLoaded(true);
        }
        
        if (safeData.alternatives.length === 0) {
          fetchAlternatives(searchQuery);
        } else {
          setAlternativesLoaded(true);
        }
      } else {
        setError(data.message || 'Search failed');
        // Display default data
        setSearchResults({
          name: searchQuery,
          description: `No detailed information found for ${searchQuery}. Please try again or search for a different name.`,
          sources: [],
          images: [],
          alternatives: []
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Server connection error: ' + err.message);
      // Display default data
      setSearchResults({
        name: searchQuery,
        description: `Connection error. Please ensure the server is running and try again.`,
        sources: [],
        images: [],
        alternatives: []
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch images separately
   */
  const fetchImages = async (query) => {
    const API_BASE = `http://${window.location.hostname}:5000/api`;
    try {
      const response = await fetch(
        `${API_BASE}/ai-search/images?name=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setSearchResults(prev => ({
          ...prev,
          images: data.data
        }));
      }
    } catch (err) {
      console.error('Image fetch error:', err);
    } finally {
      setImagesLoaded(true);
    }
  };

  /**
   * Fetch alternatives separately
   */
  const fetchAlternatives = async (query) => {
    const API_BASE = `http://${window.location.hostname}:5000/api`;
    try {
      const response = await fetch(
        `${API_BASE}/ai-search/alternatives?name=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      if (data.success && data.data && data.data.alternatives) {
        setSearchResults(prev => ({
          ...prev,
          alternatives: data.data.alternatives
        }));
      } else if (data.success && data.alternatives) {
        // For backward compatibility
        setSearchResults(prev => ({
          ...prev,
          alternatives: data.alternatives
        }));
      }
    } catch (err) {
      console.error('Alternatives fetch error:', err);
    } finally {
      setAlternativesLoaded(true);
    }
  };

  /**
   * Search for instrument images (from tab)
   */
  const handleImageSearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (searchResults?.images && searchResults.images.length > 0) {
      setActiveTab('images');
      return;
    }
    
    setLoading(true);
    await fetchImages(searchQuery);
    setLoading(false);
    setActiveTab('images');
  };

  /**
   * Search for instrument alternatives (from tab)
   */
  const handleAlternativesSearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (searchResults?.alternatives && searchResults.alternatives.length > 0) {
      setActiveTab('alternatives');
      return;
    }
    
    setLoading(true);
    await fetchAlternatives(searchQuery);
    setLoading(false);
    setActiveTab('alternatives');
  };

  /**
   * Select an image
   */
  const handleSelectImage = (imageUrl) => {
    if (onSelectInstrument) {
      onSelectInstrument({
        name: searchQuery,
        image: imageUrl,
        description: searchResults?.description || '',
        sources: searchResults?.sources || []
      });
    }
  };

  // Check if results exist
  const hasResults = searchResults !== null;

  return (
    <div className="ai-instrument-search">
      <div className="search-header">
        <h2>🔍 AI-Powered Medical Instrument Search</h2>
        <p>Automatically search for information and images of medical instruments</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for instrument name (e.g., Surgical Scalpel, Stethoscope)"
            className="search-input"
          />
          <button type="submit" disabled={loading} className="search-btn">
            {loading ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Search Results */}
      {hasResults && (
        <div className="search-results">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              ℹ️ Information
            </button>
            <button
              className={`tab ${activeTab === 'images' ? 'active' : ''}`}
              onClick={handleImageSearch}
            >
              🖼️ Images {searchResults.images?.length > 0 && `(${searchResults.images.length})`}
            </button>
            <button
              className={`tab ${activeTab === 'alternatives' ? 'active' : ''}`}
              onClick={handleAlternativesSearch}
            >
              🔄 Alternatives {searchResults.alternatives?.length > 0 && `(${searchResults.alternatives.length})`}
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Information Tab */}
            {activeTab === 'info' && (
              <div className="info-tab">
                <h3>{searchResults.name || searchQuery}</h3>
                {searchResults.description && (
                  <div className="description">
                    <h4>📋 Description:</h4>
                    <p>{searchResults.description}</p>
                  </div>
                )}
                {searchResults.sources && searchResults.sources.length > 0 && (
                  <div className="sources">
                    <h4>📚 Sources:</h4>
                    <ul>
                      {searchResults.sources.map((source, idx) => (
                        <li key={idx}>
                          <a href={source.link} target="_blank" rel="noopener noreferrer">
                            {source.title || 'Information Source'}
                          </a>
                          {source.snippet && <p className="snippet">{source.snippet}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(!searchResults.sources || searchResults.sources.length === 0) && (
                  <div className="description">
                    <p>💡 You can search for more information using search engines.</p>
                  </div>
                )}
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="images-tab">
                {!imagesLoaded && loading ? (
                  <div className="loading-images">
                    <div className="spinner-small"></div>
                    <p>Loading images...</p>
                  </div>
                ) : searchResults.images && searchResults.images.length > 0 ? (
                  <div className="images-grid">
                    {searchResults.images.map((image, idx) => (
                      <div key={idx} className="image-card">
                        <img 
                          src={image.url || image.thumb} 
                          alt={image.alt || searchResults.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300/006341/ffffff?text=' + encodeURIComponent(searchResults.name);
                          }}
                        />
                        
                        {image.photographer && (
                          <p className="credit">📸 Photo by {image.photographer}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-results">🖼️ No images found. You can search for images manually.</p>
                )}
              </div>
            )}

            {/* Alternatives Tab */}
            {activeTab === 'alternatives' && (
              <div className="alternatives-tab">
                {!alternativesLoaded && loading ? (
                  <div className="loading-alternatives">
                    <div className="spinner-small"></div>
                    <p>Searching for alternatives...</p>
                  </div>
                ) : searchResults.alternatives && searchResults.alternatives.length > 0 ? (
                  <div className="alternatives-list">
                    {searchResults.alternatives.map((alt, idx) => (
                      <div key={idx} className="alternative-item">
                        <h4>🔧 {typeof alt === 'string' ? alt : alt.title || alt.name || `Alternative ${idx + 1}`}</h4>
                        {typeof alt !== 'string' && alt.snippet && <p>{alt.snippet}</p>}
                        {typeof alt !== 'string' && alt.link && alt.link !== '#' && (
                          <a href={alt.link} target="_blank" rel="noopener noreferrer">
                            Read more →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-results">🔄 No specific alternatives found. Alternatives may vary based on required specifications.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !hasResults && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Searching for information...</p>
        </div>
      )}
    </div>
  );
};

export default AIInstrumentSearch;