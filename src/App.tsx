import { useState, useEffect } from "react";
import { IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, setupIonicReact, IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel as IonItemLabel, IonButton, IonSpinner } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Navigate } from "react-router-dom";
import { homeOutline, searchOutline, folderOutline, radioOutline } from "ionicons/icons";
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

  useEffect(() => {
    BleClient.initialize().then(() => {
      setBtEnabled(true);
    }).catch(console.error);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Estado de Conexiones</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonIcon icon={radioOutline} slot="start" />
            <IonItemLabel>
              <h2>Bluetooth LE</h2>
              <p>{btEnabled ? "Activado" : "Desactivado"}</p>
            </IonItemLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
}

function BuscarScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  const scan = async () => {
    try {
      setScanning(true);
      setDevices([]);
      await BleClient.initialize();
      await BleClient.requestLEScan({}, (result) => {
        setDevices(prev => [...prev, result.device]);
      });
      setTimeout(async () => {
        await BleClient.stopLEScan();
        setScanning(false);
      }, 5000);
    } catch (error) {
      console.error(error);
      setScanning(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dispositivos Cercanos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton expand="block" onClick={scan} disabled={scanning}>
          {scanning ? <IonSpinner name="crescent" /> : "Escanear BLE"}
        </IonButton>
        <IonList>
          {devices.map((device, i) => (
            <IonItem key={i}>
              <IonIcon icon={radioOutline} slot="start" />
              <IonItemLabel>
                <h2>{device.name || "Unknown Device"}</h2>
                <p>{device.deviceId}</p>
              </IonItemLabel>
              <IonButton slot="end">Conectar</IonButton>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
}

function ArchivosScreen() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Transferencia</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton expand="block">Seleccionar Archivos</IonButton>
      </IonContent>
    </IonPage>
  );
}

function TapScreen() {
  const [nfcStatus, setNfcStatus] = useState("Iniciando...");

  useEffect(() => {
    startNfc();
    return () => {
      CapacitorNfc.stopScanning().catch(() => {});
    };
  }, []);

  const startNfc = async () => {
    try {
      await CapacitorNfc.startScanning();
      setNfcStatus("NFC Activo - Acerca un dispositivo");
      CapacitorNfc.addListener("nfcEvent", (event) => {
        setNfcStatus(`Etiqueta leída: ${JSON.stringify(event)}`);
      });
    } catch (e) {
      setNfcStatus("Error al iniciar NFC");
    }
  };

  const shareContact = async () => {
    try {
      const payload = new TextEncoder().encode("Contacto JP Connect");
      const message: NdefRecord[] = [{
        tnf: 1,
        type: [0x54],
        id: [],
        payload: [0x02, 0x65, 0x6e, ...Array.from(payload)]
      }];
      await CapacitorNfc.write({ records: message });
      alert("Contacto compartido exitosamente!");
    } catch (e) {
      console.error(e);
      alert("Error al compartir contacto");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>NFC Tap & Share</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding text-center">
        <p>{nfcStatus}</p>
        <IonButton expand="block" onClick={shareContact}>Compartir mi Contacto</IonButton>
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
            <Route exact path="/dashboard" component={DashboardScreen} />
            <Route exact path="/buscar" component={BuscarScreen} />
            <Route exact path="/archivos" component={ArchivosScreen} />
            <Route exact path="/tap" component={TapScreen} />
            <Route exact path="/">
              <Navigate to="/dashboard" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
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
