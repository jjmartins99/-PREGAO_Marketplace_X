
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { CameraIcon, BoltIcon, BoltSlashIcon } from '@heroicons/react/24/solid';

interface POSScannerProps {
  onBarcodeScanned: (barcode: string) => void;
}

const POSScanner: React.FC<POSScannerProps> = ({ onBarcodeScanned }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = new BrowserMultiFormatReader();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const startScan = useCallback(() => {
    if (videoRef.current && selectedDeviceId) {
      codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
        if (result) {
          onBarcodeScanned(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
           console.error('Scan error:', err);
           setError('Ocorreu um erro ao escanear. Tente novamente.');
        }
      }).catch(err => {
        console.error('DecodeFromVideoDevice error:', err);
        setError('Não foi possível iniciar a câmara. Verifique as permissões.');
      });
    }
  }, [codeReader, onBarcodeScanned, selectedDeviceId]);


  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setVideoInputDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId); // Select first camera by default
        } else {
            setError("Nenhuma câmara encontrada.");
        }
      })
      .catch(err => {
        setError("Erro ao listar dispositivos. Verifique as permissões da câmara.");
        console.error("enumerateDevices error", err);
      });

      return () => {
        codeReader.reset();
      };
  }, [codeReader]);

  useEffect(() => {
    if (selectedDeviceId) {
        startScan();
    }
  }, [selectedDeviceId, startScan]);

  const handleTorchToggle = () => {
    // Torch functionality depends on the device and browser support
    // This is a simplified implementation
    setTorchOn(!torchOn);
    // In a real app, you would need to interact with the media stream track to control the torch
    alert("Funcionalidade de lanterna ainda não implementada.");
  };

  return (
    <div className="relative w-full aspect-square bg-gray-200 rounded-md overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover" />
      {error && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white p-4">{error}</div>}
      <div className="absolute top-2 right-2 flex flex-col space-y-2">
        <button onClick={handleTorchToggle} className="p-2 bg-black bg-opacity-50 rounded-full text-white">
          {torchOn ? <BoltSlashIcon className="h-5 w-5"/> : <BoltIcon className="h-5 w-5"/>}
        </button>
      </div>
       <div className="absolute bottom-2 left-2 right-2">
         {videoInputDevices.length > 1 && (
            <select
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full p-2 bg-black bg-opacity-50 text-white rounded-md border-none"
            >
                {videoInputDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                ))}
            </select>
         )}
       </div>
    </div>
  );
};

export default POSScanner;
