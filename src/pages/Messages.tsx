import React from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import {
  SearchIcon,
  SendIcon,
  PaperclipIcon,
  MoreVerticalIcon } from
'lucide-react';
const contacts = [
{
  id: 1,
  name: 'Ahmed Al-Fayed',
  lastMessage: 'Thank you for the update.',
  time: '10:42 AM',
  unread: 0,
  active: true
},
{
  id: 2,
  name: 'Fatima Bello',
  lastMessage: 'When is the deadline for visa renewal?',
  time: 'Yesterday',
  unread: 2,
  active: false
},
{
  id: 3,
  name: 'Raj Patel',
  lastMessage: 'I have submitted my transcript.',
  time: 'Monday',
  unread: 0,
  active: false
}];

export function Messages() {
  return (
    <div className="h-[calc(100vh-140px)] animate-in fade-in duration-500 flex flex-col">
      <h1 className="text-2xl font-bold text-must-text-primary mb-4 shrink-0">
        Messages
      </h1>

      <Card className="flex-1 flex overflow-hidden">
        {/* Contacts List */}
        <div className="w-full md:w-1/3 border-r border-must-border flex flex-col bg-must-surface">
          <div className="p-4 border-b border-must-border">
            <Input
              placeholder="Search messages..."
              icon={<SearchIcon className="w-4 h-4" />} />

          </div>
          <div className="flex-1 overflow-y-auto scrollbar-custom">
            {contacts.map((contact) =>
            <div
              key={contact.id}
              className={`p-4 border-b border-must-border cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${contact.active ? 'bg-slate-50 dark:bg-slate-800/80' : ''}`}>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-must-navy text-white flex items-center justify-center font-bold">
                      {contact.name.charAt(0)}
                    </div>
                    {contact.active &&
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-sm text-must-text-primary truncate">
                        {contact.name}
                      </h3>
                      <span className="text-xs text-must-text-secondary shrink-0">
                        {contact.time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p
                      className={`text-sm truncate ${contact.unread > 0 ? 'font-semibold text-must-text-primary' : 'text-must-text-secondary'}`}>

                        {contact.lastMessage}
                      </p>
                      {contact.unread > 0 &&
                    <span className="bg-must-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                          {contact.unread}
                        </span>
                    }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-1 flex-col bg-slate-50 dark:bg-[#0f172a]">
          {/* Chat Header */}
          <div className="h-16 border-b border-must-border bg-must-surface flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-must-navy text-white flex items-center justify-center font-bold">
                A
              </div>
              <div>
                <h2 className="font-semibold text-must-text-primary">
                  Ahmed Al-Fayed
                </h2>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>
            <button className="p-2 text-must-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <MoreVerticalIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-custom">
            <div className="flex justify-center">
              <span className="text-xs font-medium text-must-text-secondary bg-must-surface px-3 py-1 rounded-full border border-must-border shadow-sm">
                Today
              </span>
            </div>

            <div className="flex justify-start">
              <div className="bg-must-surface border border-must-border text-must-text-primary rounded-2xl rounded-tl-sm px-4 py-2 max-w-[70%] shadow-sm">
                <p className="text-sm">
                  Hello Advisor, I wanted to ask about the enrollment letter
                  process.
                </p>
                <span className="text-[10px] text-must-text-secondary mt-1 block text-right">
                  10:30 AM
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="bg-must-navy text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[70%] shadow-sm">
                <p className="text-sm">
                  Hi Ahmed. You can request it through the Requests tab. It
                  usually takes 2-3 business days to process.
                </p>
                <span className="text-[10px] text-blue-200 mt-1 block text-right">
                  10:35 AM
                </span>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="bg-must-surface border border-must-border text-must-text-primary rounded-2xl rounded-tl-sm px-4 py-2 max-w-[70%] shadow-sm">
                <p className="text-sm">Thank you for the update.</p>
                <span className="text-[10px] text-must-text-secondary mt-1 block text-right">
                  10:42 AM
                </span>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-must-surface border-t border-must-border shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-must-border rounded-full px-4 py-2">
              <button className="text-must-text-secondary hover:text-must-navy transition-colors">
                <PaperclipIcon className="w-5 h-5" />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-transparent outline-none text-sm text-must-text-primary px-2" />

              <button className="w-8 h-8 bg-must-green text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors shrink-0">
                <SendIcon className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>);

}