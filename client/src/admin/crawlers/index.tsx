import React from 'react';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ThemeSwitch } from '@/components/theme-switch';
import { Breadcrumbs } from '@/components/ui/breadcrumb'

export default function Crawlers() {
  return (
  
      <div className="flex min-h-screen flex-col">
        <Header>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSwitch />
            
          </div>
        </Header>
        <Main>
                           <div className="flex items-center">
                              <Breadcrumbs
                                items={[
                                  {
                                    title: 'Crawler Automation',
                                    href: '/crawlers',
                                  }
                                ]}
                              />
                            </div>
        
        </Main>
      </div>
   
  );
}

