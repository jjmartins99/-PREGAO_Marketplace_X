
import { http, HttpResponse } from 'msw';
import { mockProducts, mockUsers, mockDelivery } from './data';

export const handlers = [
  // Authentication
  http.post('/api/login', async ({ request }) => {
    const { email } = await request.json() as {email: string};
    const user = mockUsers.find(u => u.email === email);
    
    if (user) {
        return HttpResponse.json({ token: 'fake-jwt-token-for-' + user.id });
    }
    return new HttpResponse('Unauthorized', { status: 401 });
  }),

  http.get('/api/user', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
        // Simple mock: extract ID from fake token
        const userId = parseInt(authHeader.split('-').pop() || '0');
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
            return HttpResponse.json(user);
        }
    }
    return new HttpResponse(null, { status: 401 });
  }),
  
  // Products
  http.get('/api/produtos', () => {
    return HttpResponse.json(mockProducts);
  }),
  
  // Delivery
  http.get('/api/delivery/:id/tracking', () => {
    // Simulate location change
    const updatedDelivery = {
        ...mockDelivery,
        tracking: {
            lat: mockDelivery.tracking.lat + (Math.random() - 0.5) * 0.001,
            lng: mockDelivery.tracking.lng + (Math.random() - 0.5) * 0.001,
        }
    };
    return HttpResponse.json(updatedDelivery);
  }),
];
