'use client';

import React, { useState } from 'react';
import { MessageCircle, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const contact = {
    name: "Ahmad Saoghi",
    role: "Pengembang",
    image: "https://i.imgur.com/21ypLKy.png",
    number: "6285189536359",
    status: "Online"
  };

  const handleChat = () => {
    const message = encodeURIComponent("Halo, saya butuh bantuan terkait CertiGen Pro.");
    window.open(`https://wa.me/${contact.number}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden w-80 border border-gray-200 dark:border-gray-700"
          >
            {/* Header Widget */}
            <div className="bg-[#08142C] p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 fill-white" />
                <span className="font-bold">Chat via WhatsApp</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Contact List */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={handleChat}
                className="w-full flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 group"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-700">
                    <img
                      src={contact.image}
                      alt={contact.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#08142C] border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>

                <div className="flex-1 text-left">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-[#08142C] transition-colors">
                    {contact.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{contact.role}</p>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-[#08142C] fill-current" />
                    <span className="text-xs text-[#08142C] font-medium">{contact.status}</span>
                  </div>
                </div>

                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#08142C]" />
              </button>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <p className="text-xs text-blue-800 dark:text-blue-400 font-medium flex items-center justify-center gap-2">
                  <ChevronUp className="w-3 h-3 animate-bounce" />
                  Pesan App atau Tanya Pengembang Klik Ini
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        animate={isOpen ? {} : { y: [0, -8, 0] }}
        transition={isOpen ? {} : {
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        }}
        className={`flex items-center justify-center w-14 h-14 bg-[#08142C] hover:bg-[#0a1a3a] text-white rounded-full shadow-xl shadow-blue-900/40 transition-all duration-300 z-50`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-8 h-8" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-8 h-8 fill-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
