# Crawler Module

This module provides functionality for managing and executing crawler tasks using the browser-use library with Google Gemini integration.

## API Implementation

The crawler module now uses a real API implementation that connects to the server's crawler API endpoints. The implementation includes fallbacks to mock data when the API is not available, ensuring that the UI remains functional even when the server is not running.

## API Endpoints

The real API implementation connects to the following server endpoints:

- `POST /crawlers/tasks`: Create a new crawler task
- `GET /crawlers/tasks/{task_id}`: Get a task by ID
- `GET /crawlers/tasks/{task_id}/result`: Get task result
- `GET /crawlers/tasks`: List all tasks
- `DELETE /crawlers/tasks/{task_id}`: Cancel a task
- `POST /crawlers/execute`: Execute a crawler task directly
- `GET /crawlers/health`: Check the health of the crawler service

## Data Model Mapping

The client-side crawler model is mapped to the server-side task model as follows:

| Client (CrawlerDetails)   | Server (CrawlerTask)     |
|---------------------------|--------------------------|
| id                        | task_id                  |
| name                      | (Generated from task_id) |
| description               | instructions             |
| type                      | task_type                |
| status                    | status                   |
| targets[0].url            | url                      |
| profile.id                | profile_id               |
| (Not directly mapped)     | max_duration             |
| (Not directly mapped)     | parameters               |
| createdAt                 | created_at               |

## Task Types

The server supports the following task types:

- `web`: General web browsing tasks
- `youtube`: YouTube watching tasks
- `social`: Social media tasks

## Example Usage

```tsx
import { useCrawlers } from '@/admin/crawlers/context/crawlers-context';

function MyCrawlerComponent() {
  const {
    crawlers,
    loading,
    createCrawler,
    startCrawler,
    stopCrawler,
    healthCheck
  } = useCrawlers();

  const handleCreateCrawler = async () => {
    await createCrawler({
      name: 'Google Search Crawler',
      description: 'Search for "undetectable browser" on Google',
      type: 'search',
      status: 'stopped',
      behavior: 'human',
      targets: [
        {
          url: 'https://www.google.com',
          platform: 'google',
          keywords: ['undetectable browser'],
          maxDepth: 3,
          maxPages: 10
        }
      ],
      profile: { id: 'profile-1', name: 'Default Profile' },
      performance: {
        pagesVisited: 0,
        clicksGenerated: 0,
        impressions: 0,
        adClicks: 0,
        timeSpent: 0,
        bounceRate: 0,
        conversionRate: 0,
        errorRate: 0
      },
      schedule: {
        frequency: 'once',
        startTime: new Date().toISOString(),
        timezone: 'UTC'
      },
      tags: []
    });
  };

  // Check the health of the crawler service
  const checkHealth = async () => {
    const health = await healthCheck();
    console.log('Crawler service health:', health);
  };

  return (
    <div>
      <button onClick={handleCreateCrawler}>Create Crawler</button>
      <button onClick={checkHealth}>Check Health</button>
      {/* Rest of your component */}
    </div>
  );
}
```
