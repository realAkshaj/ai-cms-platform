import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">AI</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI CMS Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Intelligent Content Management with AI-Powered Features
          </p>
        </div>
        
        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-xl">🤖</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Content Generation</h3>
            <p className="text-gray-600 text-sm">Generate high-quality content with AI assistance</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 text-xl">⚡</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-time Collaboration</h3>
            <p className="text-gray-600 text-sm">Work together with your team in real-time</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-xl">🎯</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">SEO Optimization</h3>
            <p className="text-gray-600 text-sm">Automatically optimize content for search engines</p>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="space-x-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
          >
            Get Started Free
          </Link>
        </div>
        
        <p className="mt-6 text-sm text-gray-500">
          No credit card required • Free tier available
        </p>
      </div>
    </div>
  );
}