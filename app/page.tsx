
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap, Brain, MessageSquare, Code, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStarted = () => {
    // Redirect to signup page
    window.location.href = '/signup';
  };

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Advanced AI Intelligence",
      description: "Powered by Google's most sophisticated AI model for accurate, contextual responses"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Natural Conversations",
      description: "Engage in human-like dialogue that understands context and nuance"
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "Code Assistance",
      description: "Get help with programming, debugging, and technical problem-solving"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Learning & Research",
      description: "Explore topics, get explanations, and expand your knowledge instantly"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Creative Content",
      description: "Generate ideas, write stories, and unleash your creative potential"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Experience instant responses with cutting-edge processing speed"
    }
  ];



  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Animated Background */}
      {mounted && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-violet-500/10 blur-xl"
                style={{
                  width: Math.random() * 300 + 100,
                  height: Math.random() * 300 + 100,
                }}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                animate={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                transition={{
                  duration: Math.random() * 20 + 20,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-violet-400 to-white bg-clip-text text-transparent leading-tight mt-20"
            >
              The Future of AI
              <br />
              Conversation is Here
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Experience the power of Google most advanced AI model. 
              Get instant answers, creative content, and intelligent assistance.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                onClick={handleGetStarted}
                className="group h-14 px-8 text-lg bg-violet-500 hover:bg-violet-600 text-black font-semibold border-0 shadow-2xl hover:shadow-violet-500 transition-all duration-300 transform hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              {/* <Button
                variant="outline"
                className="h-14 px-8 text-lg bg-transparent backdrop-blur border-gray-700 text-white hover:bg-gray-900 hover:border-emerald-500 transition-all duration-300"
              >
                Watch Demo
              </Button> */}
            </motion.div>


          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features designed to enhance your AI experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/10">
                  <div className="p-3 bg-emerald-500/10 rounded-lg w-fit mb-4">
                    <div className="text-emerald-400">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-8 md:p-12 bg-gray-900/50 backdrop-blur-xl border-gray-800">
              <div className="text-center">
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                  Powered by Google Most Advanced AI
                </h3>
                <p className="text-lg text-gray-400">
                  Experience intelligent conversations with cutting-edge natural language processing
                </p>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <Card className="p-12 bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Experience the Future?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join millions of users who are already leveraging the power of Gemini AI
              </p>
              <Button
                onClick={handleGetStarted}
                className="group h-14 px-10 text-lg bg-white text-purple-600 hover:bg-slate-100 border-0 shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="mt-6 flex items-center justify-center gap-2 text-white/80">
                <CheckCircle className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-12 border-t border-white/10">
          <div className="text-center text-slate-400">
            <p className="mb-2">© 2024 Gemini AI Chat. All rights reserved.</p>
            <p className="text-sm">Powered by Google Gemini AI • Built with Next.js & shadcn/ui</p>
          </div>
        </footer>
      </div>
    </div>
  );
}