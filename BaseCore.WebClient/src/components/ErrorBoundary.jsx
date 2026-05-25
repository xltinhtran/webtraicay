import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: '#f5f5f5'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '40px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        maxWidth: '500px'
                    }}>
                        <i className="fas fa-exclamation-circle" style={{
                            fontSize: '3rem',
                            color: '#dc3545',
                            marginBottom: '20px',
                            display: 'block'
                        }}></i>
                        <h2 style={{ marginBottom: '10px', color: '#333' }}>Oops! Có lỗi xảy ra</h2>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            {this.state.error?.message || 'Có lỗi không mong muốn'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '10px 20px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Tải lại trang
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
