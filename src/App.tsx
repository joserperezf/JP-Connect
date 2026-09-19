import { useState, useEffect, useRef } from "react";
import { IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, setupIonicReact, IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel as IonItemLabel, IonButton, IonSpinner, IonToggle, IonInput, IonSearchbar, IonProgressBar, IonText } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Navigate } from "react-router-dom";
import { homeOutline, searchOutline, folderOutline, radioOutline, bluetoothOutline, wifiOutline, phonePortraitOutline, documentOutline, cloudUploadOutline, checkmarkCircle } from "ionicons/icons";
import { BleClient } from "@capacitor-community/bluetooth-le";
import { CapacitorNfc, NdefRecord } from "@capgo/capacitor-nfc";

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

setupIonicReact();

function DashboardScreen() {
  const [btEnabled, setBtEnabled] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(true);

  useEffect(() => {
    // Check initial BLE state
    BleClient.initialize().then(() => {
      setBtEnabled(true);
    }).catch(() => setBtEnabled(false));

    // Check initial NFC state
    CapacitorNfc.getStatus().then(res => {
      setNfcEnabled(res.status === 'NFC_OK');
    }).catch(console.error);
    
    // Listen to NFC state changes natively
    const nfcListener = CapacitorNfc.addListener('nfcStateChange', (event) => {
      setNfcEnabled(event.enabled);
    });

    return () => {
      nfcListener.then(l => l.remove()).catch(() => {});
    };
  }, []);

  const handleNfcToggle = async (checked: boolean) => {
    if (checked !== nfcEnabled) {
      try {
        await CapacitorNfc.showSettings();
      } catch (e) {
        console.error("No se pudo abrir la configuración de NFC", e);
      }
    }
  };

  const handleBtToggle = async (checked: boolean) => {
    if (checked && !btEnabled) {
      try {
        await BleClient.requestEnable();
        const enabled = await BleClient.isEnabled();
        setBtEnabled(!!enabled);
      } catch (e) {
        console.error("No se pudo activar Bluetooth", e);
        setBtEnabled(false);
      }
    } else if (!checked && btEnabled) {
      setBtEnabled(false); 
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle className="font-bold text-gray-900">Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Conexiones Activas</h2>
          
          <div className="space-y-4">
            <div className="gravity-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <IonIcon icon={bluetoothOutline} size="large" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 m-0">Bluetooth LE</h3>
                  <p className="text-xs text-gray-500 m-0">{btEnabled ? "Visible y escaneando" : "Apagado"}</p>
                </div>
              </div>
              <IonToggle checked={btEnabled} onIonChange={e => handleBtToggle(e.detail.checked)} color="primary" />
            </div>

            <div className="gravity-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <IonIcon icon={phonePortraitOutline} size="large" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 m-0">NFC</h3>
                  <p className="text-xs text-gray-500 m-0">{nfcEnabled ? "Lector activo" : "Apagado"}</p>
                </div>
              </div>
              <IonToggle checked={nfcEnabled} onIonChange={e => handleNfcToggle(e.detail.checked)} color="primary" />
            </div>

            <div className="gravity-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <IonIcon icon={wifiOutline} size="large" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 m-0">Wi-Fi Direct</h3>
                  <p className="text-xs text-gray-500 m-0">{wifiEnabled ? "Grupo P2P creado" : "Apagado"}</p>
                </div>
              </div>
              <IonToggle checked={wifiEnabled} onIonChange={e => setWifiEnabled(e.detail.checked)} color="primary" />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

function BuscarScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectedId, setConnectedId] = useState<string | null>(null);

  const scan = async () => {
    try {
      setScanning(true);
      setDevices([]);
      setConnectedId(null);
      await BleClient.initialize();
      
      // On Android < 12, Location Services must be ON to scan for BLE devices
      const locEnabled = await BleClient.isLocationEnabled();
      if (!locEnabled) {
        alert("Por favor, enciende la Ubicación (GPS) para escanear dispositivos Bluetooth cercanos.");
        await BleClient.openLocationSettings();
        setScanning(false);
        return;
      }

      await BleClient.requestLEScan({}, (result) => {
        setDevices(prev => {
          if (prev.find(d => d.device.deviceId === result.device.deviceId)) return prev;
          return [...prev, result];
        });
      });
      setTimeout(async () => {
        await BleClient.stopLEScan();
        setScanning(false);
      }, 5000);
    } catch (error) {
      console.error("Error al escanear BLE:", error);
      alert("Error al escanear: Asegúrate de otorgar permisos de Ubicación y tener el GPS encendido.");
      setScanning(false);
    }
  };

  const filteredDevices = devices.filter(d => 
    (d.device.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle className="font-bold text-gray-900">Buscar</IonTitle>
        </IonToolbar>
        <div className="px-4 pb-2 bg-white">
          <IonSearchbar 
            value={searchQuery} 
            onIonInput={(e) => setSearchQuery(e.target.value as string)}
            placeholder="Buscar dispositivos..."
            className="p-0 m-0"
            mode="ios"
          />
        </div>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <IonButton className="gravity-button mb-4" expand="block" onClick={scan} disabled={scanning}>
          {scanning ? <IonSpinner name="crescent" color="light" /> : "Escanear Dispositivos"}
        </IonButton>
        
        {filteredDevices.length === 0 && !scanning && (
          <div className="text-center mt-10 text-gray-400">
            <IonIcon icon={bluetoothOutline} size="large" className="opacity-50 mb-2" />
            <p>No se encontraron dispositivos</p>
          </div>
        )}

        <div className="space-y-3">
          {filteredDevices.map((result, i) => (
            <div key={i} className="gravity-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                  <IonIcon icon={bluetoothOutline} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm m-0">{result.device.name || "Unknown Device"}</h3>
                  <p className="text-xs text-gray-500 m-0">RSSI: {result.rssi} dBm</p>
                </div>
              </div>
              <IonButton 
                fill={connectedId === result.device.deviceId ? "solid" : "outline"}
                color={connectedId === result.device.deviceId ? "success" : "primary"}
                size="small"
                shape="round"
                onClick={() => setConnectedId(result.device.deviceId)}
              >
                {connectedId === result.device.deviceId ? "Conectado" : "Conectar"}
              </IonButton>
            </div>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
}

function ArchivosScreen() {
  const [progress, setProgress] = useState(0);
  const [transferring, setTransferring] = useState(false);
  const [fileName, setFileName] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateTransfer = (name: string) => {
    setFileName(name);
    setTransferring(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 1) {
          clearInterval(interval);
          setTimeout(() => setTransferring(false), 1000);
          return 1;
        }
        return p + 0.1;
      });
    }, 300);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateTransfer(e.target.files[0].name);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle className="font-bold text-gray-900">Archivos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />

        <div 
          className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-white mb-6 cursor-pointer hover:bg-gray-50 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
            <IonIcon icon={cloudUploadOutline} size="large" />
          </div>
          <h3 className="text-gray-900 font-semibold m-0">Toca para enviar archivos</h3>
          <p className="text-gray-500 text-sm mt-1">Abre el explorador de archivos</p>
        </div>

        {transferring && (
          <div className="gravity-card p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-900 truncate pr-2">Enviando "{fileName}"</span>
              <span className="text-xs font-medium text-blue-600 shrink-0">{Math.round(progress * 100)}%</span>
            </div>
            <IonProgressBar value={progress} color="primary" className="rounded-full h-2" />
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recibidos Recientemente</h2>
          <div className="gravity-card">
            {[1, 2, 3].map((item, i) => (
              <div key={i} className={`p-3 flex items-center gap-3 ${i !== 2 ? 'border-b border-gray-100' : ''}`}>
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                  <IonIcon icon={documentOutline} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm m-0">archivo_recibido_{item}.pdf</h3>
                  <p className="text-xs text-gray-400 m-0">2.{item} MB • Wi-Fi Direct</p>
                </div>
                <IonIcon icon={checkmarkCircle} className="text-green-500" />
              </div>
            ))}
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
}

function TapScreen() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [nfcStatus, setNfcStatus] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    return () => {
      CapacitorNfc.stopScanning().catch(() => {});
    };
  }, []);

  const shareContact = async () => {
    if (!name || !mobile || !email) {
      alert("Por favor completa todos los campos de contacto.");
      return;
    }

    try {
      setIsScanning(true);
      setNfcStatus("Acerca un dispositivo NFC para compartir tu contacto...");
      
      await CapacitorNfc.startScanning();
      
      // Wait for a tag to be tapped before writing
      const listener = await CapacitorNfc.addListener("nfcEvent", async () => {
        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${mobile}\nEMAIL:${email}\nEND:VCARD`;
        
        const payload = new TextEncoder().encode(vcard);
        const message: any[] = [{
          tnf: 2, 
          type: Array.from(new TextEncoder().encode("text/vcard")),
          id: [],
          payload: Array.from(payload)
        }];

        try {
          await CapacitorNfc.write({ records: message });
          setNfcStatus("¡Contacto compartido exitosamente!");
        } catch (e) {
          console.error("Error escribiendo NFC", e);
          setNfcStatus("Error al escribir el contacto en la etiqueta.");
        }
        
        setIsScanning(false);
        listener.remove();
        await CapacitorNfc.stopScanning();
      });
      
    } catch (error) {
      console.error("Error iniciando NFC", error);
      setNfcStatus("Error al iniciar NFC.");
      setIsScanning(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle className="font-bold text-gray-900">NFC Tap</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        
        <div className="mb-6 text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className={`absolute inset-0 bg-blue-100 rounded-full flex items-center justify-center ${isScanning ? 'pulse-ring' : ''}`}>
              <IonIcon icon={radioOutline} size="large" className="text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 m-0">Comparte tu Contacto</h2>
          <p className="text-sm text-gray-500 mt-1">Ingresa tus datos y acerca otro dispositivo</p>
        </div>

        <div className="gravity-card p-4 mb-6">
          <IonInput 
            className="gravity-input"
            label="Nombre Completo" 
            labelPlacement="floating" 
            placeholder="Ej. Juan Pérez"
            value={name}
            onIonInput={e => setName(e.target.value as string)}
          />
          <IonInput 
            className="gravity-input"
            label="Teléfono Móvil" 
            labelPlacement="floating" 
            type="tel"
            placeholder="Ej. +34 600 000 000"
            value={mobile}
            onIonInput={e => setMobile(e.target.value as string)}
          />
          <IonInput 
            className="gravity-input"
            label="Correo Electrónico" 
            labelPlacement="floating" 
            type="email"
            placeholder="Ej. juan@ejemplo.com"
            value={email}
            onIonInput={e => setEmail(e.target.value as string)}
          />
        </div>

        <IonButton 
          className="gravity-button w-full" 
          expand="block" 
          onClick={shareContact}
          disabled={isScanning}
        >
          {isScanning ? "Esperando dispositivo NFC..." : "Compartir Tarjeta"}
        </IonButton>

        {nfcStatus && (
          <p className={`text-center mt-4 text-sm font-medium ${nfcStatus.includes('Error') ? 'text-red-500' : 'text-blue-600'}`}>
            {nfcStatus}
          </p>
        )}

      </IonContent>
    </IonPage>
  );
}

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/buscar" element={<BuscarScreen />} />
            <Route path="/archivos" element={<ArchivosScreen />} />
            <Route path="/tap" element={<TapScreen />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </IonRouterOutlet>
          <IonTabBar slot="bottom" className="border-t border-gray-200">
            <IonTabButton tab="dashboard" href="/dashboard">
              <IonIcon icon={homeOutline} />
              <IonLabel>Dashboard</IonLabel>
            </IonTabButton>
            <IonTabButton tab="buscar" href="/buscar">
              <IonIcon icon={searchOutline} />
              <IonLabel>Buscar</IonLabel>
            </IonTabButton>
            <IonTabButton tab="archivos" href="/archivos">
              <IonIcon icon={folderOutline} />
              <IonLabel>Archivos</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tap" href="/tap">
              <IonIcon icon={radioOutline} />
              <IonLabel>Tap</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
}
