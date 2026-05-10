"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
          <p className="text-5xl mb-4">💥</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Quelque chose s'est mal passé</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">{this.state.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: "" }); window.location.reload(); }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition">
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
