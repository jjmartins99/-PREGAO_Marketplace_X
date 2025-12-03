
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import apiClient from '@/services/apiClient';
import { Delivery } from '@/types';
import DeliveryMap from '@/components/delivery/DeliveryMap';
import { TruckIcon, ClockIcon, UserIcon } from '@heroicons/react/24/solid';

const fetchDelivery = async (deliveryId: string): Promise<Delivery> => {
    // In a real app, you would use the deliveryId param
    // For now, we use a static ID that the mock handler recognizes
    const { data } = await apiClient.get(`/delivery/${deliveryId}/tracking`);
    return data;
};

const DeliveryTrackingPage = () => {
    const { id } = useParams<{ id: string }>();
    const deliveryId = id || 'order123'; // fallback for demonstration

    const { data: delivery, isLoading, error } = useQuery({
        queryKey: ['delivery', deliveryId],
        queryFn: () => fetchDelivery(deliveryId),
        refetchInterval: 5000, // Refetch every 5 seconds
    });

    if (isLoading) return <p>A carregar detalhes da entrega...</p>;
    if (error) return <p className="text-red-500">Não foi possível carregar os dados da entrega.</p>;
    if (!delivery) return <p>Entrega não encontrada.</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Acompanhar Pedido #{delivery.orderId}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 rounded-lg overflow-hidden shadow-lg h-96 md:h-full">
                    <DeliveryMap tracking={delivery.tracking} />
                </div>
                <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Detalhes da Entrega</h2>
                    <div className="space-y-4 text-gray-700">
                        <div className="flex items-center">
                            <ClockIcon className="h-6 w-6 mr-3 text-primary" />
                            <div>
                                <p className="font-semibold">Entrega Prevista</p>
                                <p>{delivery.deliveryTime}</p>
                            </div>
                        </div>
                         <div className="flex items-center">
                            <UserIcon className="h-6 w-6 mr-3 text-primary" />
                            <div>
                                <p className="font-semibold">Motorista</p>
                                <p>{delivery.driverName}</p>
                            </div>
                        </div>
                         <div className="flex items-center">
                            <TruckIcon className="h-6 w-6 mr-3 text-primary" />
                            <div>
                                <p className="font-semibold">Veículo</p>
                                <p>{delivery.vehicle.make} {delivery.vehicle.model} ({delivery.vehicle.licensePlate})</p>
                            </div>
                        </div>
                    </div>
                     <div className="mt-6">
                        <p className="font-semibold text-lg">Estado: 
                            <span className="ml-2 bg-green-100 text-green-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded">
                                {delivery.status}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryTrackingPage;
