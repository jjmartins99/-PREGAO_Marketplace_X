
import React from 'react';
import FileUploaderMapper from '@/components/import/FileUploaderMapper';

const ImportPage = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Importação em Massa</h1>
            <p className="text-gray-600 mb-6">Importe o seu catálogo de produtos e stocks via ficheiro CSV.</p>
            <div className="bg-white p-6 rounded-lg shadow">
                 <FileUploaderMapper />
            </div>
        </div>
    );
};

export default ImportPage;
