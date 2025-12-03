
import React from 'react';
import DataTable from '@/components/admin/DataTable';

const AdminPage = () => {
    // This would fetch real data in a full application
    const users = [
        { id: 1, name: 'Admin User', email: 'admin@pregao.co.ao', role: 'Admin'},
        { id: 2, name: 'Gerente Loja', email: 'gerente@pregao.co.ao', role: 'Gerente'},
        { id: 3, name: 'Vendedor Caixa 1', email: 'vendedor1@pregao.co.ao', role: 'Vendedor'},
    ];

    const columns = [
        { accessor: 'id', Header: 'ID' },
        { accessor: 'name', Header: 'Nome' },
        { accessor: 'email', Header: 'Email' },
        { accessor: 'role', Header: 'Perfil' },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Utilizadores</h1>
             <div className="bg-white p-6 rounded-lg shadow">
                <DataTable columns={columns} data={users} />
             </div>
        </div>
    );
};

export default AdminPage;
