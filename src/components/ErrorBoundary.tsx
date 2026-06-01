import React, { Component, ErrorInfo, ReactNode } from 'react';
import { getTranslations } from '../i18n';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ErrorBoundary caught:', error, info.componentStack); }

  render() {
    if (this.state.hasError) {
      const lang = (localStorage.getItem('swm_lang') as 'zh' | 'en') || 'zh';
      const td = getTranslations(lang);
      return this.props.fallback || (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center p-10 rounded-[2rem] bg-white/[0.05] backdrop-blur-md border border-white/10 max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2">{td.errorTitle}</h2>
            <p className="text-sm text-white/50 mb-6">{this.state.error?.message || td.unknownError}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="flex items-center space-x-2 px-6 py-3 rounded-full bg-white text-black hover:bg-white/90 transition-colors mx-auto text-sm">
              <RefreshCw className="w-4 h-4" /><span>{td.reload}</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
