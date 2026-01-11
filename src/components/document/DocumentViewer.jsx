import React, { useEffect, useState, useCallback, Component } from 'react';
import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import axios from '../../services/utils/axios';

// Import pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Set the worker source to the local file
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
console.log('PDF.js worker set to local file');

// Simple error boundary component
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('PDF Viewer error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ 
                    padding: '20px', 
                    textAlign: 'center',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    margin: '20px'
                }}>
                    <h3>Something went wrong</h3>
                    <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
                    <button 
                        onClick={() => this.setState({ hasError: false })}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const DocumentViewer = ({ currentCategoryId, categories, currentFileUrl, currentFileName }) => {
    const isProtected = currentCategoryId && categories && categories.find ? 
        categories.find(c => c.id === currentCategoryId)?.is_protected : false;
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pdfData, setPdfData] = useState(null);
    
    // Create plugins
    const toolbarPluginInstance = toolbarPlugin();
    const { Toolbar } = toolbarPluginInstance;
    
    const zoomPluginInstance = zoomPlugin();
    const { ZoomIn, ZoomOut } = zoomPluginInstance;
    
    // Configure the default layout plugin with protection options
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: (defaultTabs) => [],
        toolbarPlugin: {
            fullScreenPlugin: {
                // Disable fullscreen for protected documents
                enableShortcuts: !isProtected,
            },
            downloadPlugin: {
                // Disable download for protected documents
                enableShortcuts: !isProtected,
                // Completely disable download button for protected documents
                renderDownloadButton: (props) => {
                    if (isProtected) {
                        return null; // Don't render the button at all for protected documents
                    }
                    
                    // For non-protected documents, render the download button
                    return props.onClick ? (
                        <button 
                            className="rpv-core__button" 
                            onClick={props.onClick} 
                            title="Download"
                        >
                            <span className="rpv-core__button-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                    <path d="M0 0h24v24H0V0z" fill="none"/>
                                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/>
                                </svg>
                            </span>
                        </button>
                    ) : null;
                },
            },
            printPlugin: {
                // Disable print for protected documents
                enableShortcuts: !isProtected,
                // Hide print button for protected documents
                renderPrintButton: (props) => isProtected ? null : props.onClick ? 
                    <button 
                        className="rpv-core__button" 
                        onClick={props.onClick} 
                        title="Print"
                    >
                        <span className="rpv-core__button-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                <path d="M0 0h24v24H0V0z" fill="none"/>
                                <path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-4h8v2zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"/>
                            </svg>
                        </span>
                    </button> : null,
            },
        },
    });

    // Fetch PDF data with authentication
    useEffect(() => {
        const fetchPdf = async () => {
            if (!currentFileUrl) return;
            
            try {
                setIsLoading(true);
                setError(null);
                
                // Fetch the PDF using axios to include authentication
                const response = await axios.get(currentFileUrl, {
                    responseType: 'arraybuffer'
                });
                
                // Convert the array buffer to a blob
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                
                setPdfData(url);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching PDF:', error);
                setError('Failed to load PDF. Please try again.');
                setIsLoading(false);
            }
        };

        fetchPdf();

        // Cleanup function to revoke the blob URL
        return () => {
            if (pdfData) {
                URL.revokeObjectURL(pdfData);
            }
        };
    }, [currentFileUrl]);

    // Log props for debugging
    useEffect(() => {
        console.log('DocumentViewer props:', { 
            currentCategoryId, 
            isProtected, 
            currentFileUrl,
            currentFileName,
            workerSrc: GlobalWorkerOptions.workerSrc
        });
    }, [currentCategoryId, isProtected, currentFileUrl, currentFileName]);

    // Add event listeners to prevent downloads for protected documents
    useEffect(() => {
        if (isProtected) {
            // Prevent keyboard shortcuts
            const preventKeyboardShortcuts = (e) => {
                if (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u')) {
                    e.preventDefault();
                    console.log('Download/print prevented');
                    return false;
                }
            };
            
            // Prevent right-click context menu
            const preventContextMenu = (e) => {
                e.preventDefault();
                return false;
            };
            
            // Prevent drag and drop
            const preventDragStart = (e) => {
                e.preventDefault();
                return false;
            };
            
            // Prevent copy
            const preventCopy = (e) => {
                e.preventDefault();
                return false;
            };
            
            document.addEventListener('keydown', preventKeyboardShortcuts);
            document.addEventListener('contextmenu', preventContextMenu);
            document.addEventListener('dragstart', preventDragStart);
            document.addEventListener('copy', preventCopy);
            
            // Override the download function
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                const originalMsSaveOrOpenBlob = window.navigator.msSaveOrOpenBlob;
                window.navigator.msSaveOrOpenBlob = function() {
                    console.log('Download prevented');
                    return false;
                };
            }
            
            return () => {
                document.removeEventListener('keydown', preventKeyboardShortcuts);
                document.removeEventListener('contextmenu', preventContextMenu);
                document.removeEventListener('dragstart', preventDragStart);
                document.removeEventListener('copy', preventCopy);
                
                // Restore original function
                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                    window.navigator.msSaveOrOpenBlob = originalMsSaveOrOpenBlob;
                }
            };
        }
    }, [isProtected]);

    // Add keyboard navigation support
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle navigation keys if not in an input field
            if (e.target.tagName.toLowerCase() === 'input' || 
                e.target.tagName.toLowerCase() === 'textarea') {
                return;
            }
            
            // Left arrow key for previous page
            if (e.key === 'ArrowLeft') {
                const prevButton = document.querySelector('[title="Previous page"]');
                if (prevButton && !prevButton.disabled) {
                    prevButton.click();
                }
            }
            
            // Right arrow key for next page
            if (e.key === 'ArrowRight') {
                const nextButton = document.querySelector('[title="Next page"]');
                if (nextButton && !nextButton.disabled) {
                    nextButton.click();
                }
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Track page changes - using useCallback to prevent unnecessary re-renders
    const handlePageChange = useCallback((page) => {
        try {
            // Extract the page number from the page object
            const pageNumber = typeof page === 'object' && page.currentPage ? page.currentPage : page;
            setCurrentPage(pageNumber);
        } catch (err) {
            console.error('Error handling page change:', err);
            // Default to page 1 if there's an error
            setCurrentPage(1);
        }
    }, []);

    // Track total pages - using useCallback to prevent unnecessary re-renders
    const handleDocumentLoad = useCallback((e) => {
        try {
            // Extract the number of pages from the event object
            const numPages = e && e.doc && e.doc.numPages ? e.doc.numPages : 0;
            setTotalPages(numPages);
            setIsLoading(false);
            setError(null);
            console.log(`Document loaded with ${numPages} pages`);
        } catch (err) {
            console.error('Error handling document load:', err);
            setIsLoading(false);
            setError('Error loading document');
        }
    }, []);

    // Handle document load error
    const handleDocumentLoadError = useCallback((err) => {
        console.error('Error loading document:', err);
        setIsLoading(false);
        setError(err.message || 'Error loading document');
    }, []);

    // Reset loading state when file URL changes
    useEffect(() => {
        if (currentFileUrl) {
            setIsLoading(true);
            setError(null);
        }
    }, [currentFileUrl]);

    // Custom toolbar with controlled functionality
    const renderToolbar = (Toolbar, slots) => {
        // Safely extract components from slots
        const {
            CurrentPageInput,
            GoToNextPage,
            GoToPreviousPage,
            NumberOfPages,
            ZoomIn,
            ZoomOut,
        } = slots || {};
        
        // Safely render the toolbar
        return (
            <div style={{ alignItems: 'center', display: 'flex' }}>
                {/* Navigation controls with enhanced styling */}
                <div style={{ padding: '0 4px' }}>
                    {GoToPreviousPage ? (
                        <GoToPreviousPage>
                            {(props) => (
                                <button 
                                    className="rpv-core__button" 
                                    disabled={props.isDisabled} 
                                    onClick={props.onClick}
                                    style={{ 
                                        cursor: props.isDisabled ? 'not-allowed' : 'pointer',
                                        opacity: props.isDisabled ? 0.5 : 1,
                                        padding: '8px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderRadius: '4px',
                                    }}
                                    title="Previous page"
                                >
                                    <span className="rpv-core__button-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                            <path d="M0 0h24v24H0V0z" fill="none"/>
                                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/>
                                        </svg>
                                    </span>
                                </button>
                            )}
                        </GoToPreviousPage>
                    ) : null}
                </div>
                
                <div style={{ padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                    {CurrentPageInput ? (
                        <CurrentPageInput>
                            {(props) => {
                                // Ensure we're rendering a string or number, not an object
                                const inputValue = typeof props.value === 'object' 
                                    ? (props.value.currentPage || '') 
                                    : props.value;
                                
                                return (
                                    <input
                                        type="text"
                                        value={inputValue}
                                        style={{
                                            width: '40px',
                                            textAlign: 'center',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            padding: '4px',
                                            margin: '0 4px'
                                        }}
                                        onChange={(e) => {
                                            const pageNumber = parseInt(e.target.value, 10);
                                            if (!isNaN(pageNumber) && pageNumber > 0) {
                                                props.onChange(pageNumber);
                                            } else {
                                                props.onChange(e.target.value);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const pageNumber = parseInt(e.target.value, 10);
                                                if (!isNaN(pageNumber) && pageNumber > 0) {
                                                    props.onSubmit(pageNumber);
                                                }
                                            }
                                        }}
                                        title="Page number"
                                    />
                                );
                            }}
                        </CurrentPageInput>
                    ) : null}
                    <span style={{ margin: '0 4px' }}>/</span>
                    {NumberOfPages ? (
                        <NumberOfPages>
                            {(props) => {
                                // Ensure we're rendering a string or number, not an object
                                const pageCount = typeof props.numberOfPages === 'object'
                                    ? (props.numberOfPages.numPages || totalPages || 1)
                                    : (props.numberOfPages || totalPages || 1);
                                
                                return <span>{pageCount}</span>;
                            }}
                        </NumberOfPages>
                    ) : (
                        <span>{totalPages || 1}</span>
                    )}
                </div>
                
                <div style={{ padding: '0 4px' }}>
                    {GoToNextPage ? (
                        <GoToNextPage>
                            {(props) => (
                                <button 
                                    className="rpv-core__button" 
                                    disabled={props.isDisabled} 
                                    onClick={props.onClick}
                                    style={{ 
                                        cursor: props.isDisabled ? 'not-allowed' : 'pointer',
                                        opacity: props.isDisabled ? 0.5 : 1,
                                        padding: '8px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderRadius: '4px',
                                    }}
                                    title="Next page"
                                >
                                    <span className="rpv-core__button-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                            <path d="M0 0h24v24H0V0z" fill="none"/>
                                            <path d="M10.02 6L8.61 7.41 13.19 12l-4.58 4.59L10.02 18l6-6-6-6z"/>
                                        </svg>
                                    </span>
                                </button>
                            )}
                        </GoToNextPage>
                    ) : null}
                </div>
                
                {/* Zoom controls */}
                <div style={{ padding: '0 4px', marginLeft: 'auto' }}>
                    {ZoomOut ? (
                        <ZoomOut>
                            {(props) => (
                                <button 
                                    className="rpv-core__button" 
                                    disabled={props.isDisabled} 
                                    onClick={props.onClick}
                                    style={{ 
                                        cursor: props.isDisabled ? 'not-allowed' : 'pointer',
                                        opacity: props.isDisabled ? 0.5 : 1,
                                        padding: '8px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderRadius: '4px',
                                    }}
                                    title="Zoom out"
                                >
                                    <span className="rpv-core__button-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                            <path d="M0 0h24v24H0V0z" fill="none"/>
                                            <path d="M19 13H5v-2h14v2z"/>
                                        </svg>
                                    </span>
                                </button>
                            )}
                        </ZoomOut>
                    ) : null}
                </div>
                
                <div style={{ padding: '0 4px' }}>
                    {ZoomIn ? (
                        <ZoomIn>
                            {(props) => (
                                <button 
                                    className="rpv-core__button" 
                                    disabled={props.isDisabled} 
                                    onClick={props.onClick}
                                    style={{ 
                                        cursor: props.isDisabled ? 'not-allowed' : 'pointer',
                                        opacity: props.isDisabled ? 0.5 : 1,
                                        padding: '8px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderRadius: '4px',
                                    }}
                                    title="Zoom in"
                                >
                                    <span className="rpv-core__button-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                            <path d="M0 0h24v24H0V0z" fill="none"/>
                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                        </svg>
                                    </span>
                                </button>
                            )}
                        </ZoomIn>
                    ) : null}
                </div>
                
                {/* Only show download/print for non-protected documents */}
                {!isProtected && (
                    <>
                        <div style={{ padding: '0 4px' }}>
                            {slots.Download && typeof slots.Download === 'function' ? (
                                <slots.Download />
                            ) : null}
                        </div>
                        <div style={{ padding: '0 4px' }}>
                            {slots.Print && typeof slots.Print === 'function' ? (
                                <slots.Print />
                            ) : null}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <ErrorBoundary>
            <div className={`document-viewer ${isProtected ? 'protected-viewer' : ''}`} style={{ height: '85vh', width: '100%', position: 'relative' }}>
                {/* Security Features */}
                {isProtected && (
                    <>
                        <style dangerouslySetInnerHTML={{ __html: `
                            /* Disable Print */
                            @media print {
                                body * { display: none !important; }
                                body:after {
                                    content: "Printing is not allowed for protected documents";
                                    display: block !important;
                                }
                            }
                            /* Disable Text Selection */
                            .protected-viewer * {
                                user-select: none !important;
                                -webkit-user-select: none !important;
                                -moz-user-select: none !important;
                                -ms-user-select: none !important;
                            }
                            /* Disable Right-Click */
                            .protected-viewer {
                                -webkit-touch-callout: none !important;
                                -webkit-user-select: none !important;
                                -khtml-user-select: none !important;
                                -moz-user-select: none !important;
                                -ms-user-select: none !important;
                                user-select: none !important;
                            }
                            /* Prevent Interaction with Images & Embedded Content */
                            .protected-viewer img,
                            .protected-viewer embed,
                            .protected-viewer object,
                            .protected-viewer video {
                                pointer-events: none !important;
                            }
                            /* Overlay Protection */
                            .protection-overlay {
                                position: absolute;
                                top: 0; left: 0; right: 0; bottom: 0;
                                z-index: 10;
                                background: transparent;
                                cursor: not-allowed;
                                pointer-events: none; /* Allow scrolling */
                            }
                            
                            /* Hide download and print buttons for protected documents */
                            .protected-viewer .rpv-core__download-button,
                            .protected-viewer .rpv-core__print-button,
                            .protected-viewer [data-testid="download"],
                            .protected-viewer [data-testid="print"],
                            .protected-viewer button[aria-label="Download"],
                            .protected-viewer button[aria-label="Print"],
                            .protected-viewer [title="Download"],
                            .protected-viewer [title="Print"] {
                                display: none !important;
                                visibility: hidden !important;
                                opacity: 0 !important;
                                pointer-events: none !important;
                            }
                        `}} />
                        
                        <script dangerouslySetInnerHTML={{ __html: `
                            document.addEventListener("contextmenu", (e) => e.preventDefault());
                            document.addEventListener("keydown", (e) => {
                                if (e.ctrlKey && ["p", "s", "u"].includes(e.key.toLowerCase())) {
                                    e.preventDefault();
                                    alert("This action is not allowed.");
                                }
                            });
                            
                            // Override download functions
                            if (window.navigator) {
                                // Override msSaveOrOpenBlob (IE/Edge)
                                if (window.navigator.msSaveOrOpenBlob) {
                                    window.navigator.msSaveOrOpenBlob = function() { return false; };
                                }
                                
                                // Override saveBlob (Firefox)
                                if (window.navigator.saveBlob) {
                                    window.navigator.saveBlob = function() { return false; };
                                }
                            }
                            
                            // Override download attribute
                            Object.defineProperty(HTMLAnchorElement.prototype, 'download', {
                                set: function() {},
                                get: function() { return ''; }
                            });
                            
                            // Intercept blob URLs
                            const originalCreateObjectURL = URL.createObjectURL;
                            URL.createObjectURL = function(obj) {
                                const url = originalCreateObjectURL(obj);
                                // Add event listener to intercept clicks on blob URLs
                                document.addEventListener('click', function(e) {
                                    const target = e.target.closest('a');
                                    if (target && target.href === url) {
                                        e.preventDefault();
                                        return false;
                                    }
                                }, true);
                                return url;
                            };
                        `}} />
                    </>
                )}

                {/* PDF Viewer */}
                <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                    {pdfData ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Custom toolbar */}
                            <div style={{ padding: '8px', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                                {Toolbar ? (
                                    <Toolbar>
                                        {(slots) => {
                                            // Ensure slots is an object before passing it to renderToolbar
                                            if (slots && typeof slots === 'object') {
                                                return renderToolbar(Toolbar, slots);
                                            }
                                            // Fallback if slots is not an object
                                            return (
                                                <div style={{ padding: '8px', textAlign: 'center' }}>
                                                    Loading toolbar...
                                                </div>
                                            );
                                        }}
                                    </Toolbar>
                                ) : null}
                            </div>
                            
                            {/* Document content */}
                            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                                {isLoading && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        zIndex: 10
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{
                                                border: '4px solid #f3f3f3',
                                                borderTop: '4px solid #3498db',
                                                borderRadius: '50%',
                                                width: '40px',
                                                height: '40px',
                                                animation: 'spin 2s linear infinite',
                                                marginBottom: '10px'
                                            }} />
                                            <style dangerouslySetInnerHTML={{ __html: `
                                                @keyframes spin {
                                                    0% { transform: rotate(0deg); }
                                                    100% { transform: rotate(360deg); }
                                                }
                                            `}} />
                                            <div>Loading document...</div>
                                        </div>
                                    </div>
                                )}
                                <ErrorBoundary>
                                    <Viewer
                                        fileUrl={pdfData}
                                        plugins={[
                                            toolbarPluginInstance,
                                            zoomPluginInstance,
                                            defaultLayoutPluginInstance
                                        ]}
                                        onPageChange={handlePageChange}
                                        onDocumentLoad={handleDocumentLoad}
                                        onError={handleDocumentLoadError}
                                        renderError={(error) => (
                                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                                <h3>Error loading PDF</h3>
                                                <p>{error}</p>
                                                <p>Please try again or contact support if the issue persists.</p>
                                            </div>
                                        )}
                                    />
                                </ErrorBoundary>

                                {/* Watermark overlay */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    pointerEvents: 'none', // Allows interaction with document beneath
                                    zIndex: 5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        transform: 'rotate(-45deg)',
                                        color: 'rgba(200, 200, 200, 0.3)', // Light gray with transparency
                                        fontSize: '70px',
                                        fontWeight: 'bold',
                                        userSelect: 'none',
                                        whiteSpace: 'nowrap',
                                        width: '100%',
                                        textAlign: 'center',
                                        marginTop: '0px',
                                        fontFamily: 'Arial, sans-serif',
                                        zIndex: 2,
                                        pointerEvents: 'none',
                                        opacity: isProtected ? 0.4 : 0.2 // More visible for protected docs
                                    }}>
                                        ONLINE CPA REVIEW CLASSES
                                    </div>
                                </div>
                            </div>
                            
                            {/* Page indicator for mobile/small screens */}
                            {!isLoading && totalPages > 0 && (
                                <div style={{ 
                                    position: 'absolute', 
                                    bottom: '20px', 
                                    left: '50%', 
                                    transform: 'translateX(-50%)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 5,
                                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
                                }}>
                                    <span>
                                        {typeof currentPage === 'object' ? 
                                            (currentPage.currentPage || 1) : 
                                            (currentPage || 1)
                                        } / {
                                        typeof totalPages === 'object' ? 
                                            (totalPages.numPages || 1) : 
                                            (totalPages || 1)
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>No document selected</p>
                    )}
                </div>

                {/* Overlay to prevent interaction */}
                {isProtected && <div className="protection-overlay" />}
            </div>
        </ErrorBoundary>
    );
};

export default DocumentViewer;
