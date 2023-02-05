import React, { FC, useEffect, useState} from 'react'
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Provider, Wallet } from '@project-serum/anchor';


type PhantomEvent = "disconnect" | "connect" | "accountChanged";

interface ConnectOpts {
    onlyIfTrusted: boolean
}

export interface PhantomProvider extends Wallet {
    connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
    disconnect: ()=>Promise<void>;
    on: (event: PhantomEvent, callback: (args:any)=>void) => void;
    isPhantom: boolean;
}

export type WindowWithSolana = Window & { 
    solana?: PhantomProvider;
}

/**
 * walletAddress - set the walletAddress
 * getPhantomProvider - provider for phantom wallet
 * getAnchorProvider - anchor provider for network connection
 */
interface ConnectorProps {
    walletAddress:(address:string|null)=>void,
    getPhantomProvider:(provider:PhantomProvider | null)=>void,
    getAnchorProvider:(provider:AnchorProvider | null)=>void
}

const SolConnectorPhantom = (props:ConnectorProps) => {

    const [ walletAvail, setWalletAvail ] = useState(false)
    const [ provider, setProvider ] = useState<PhantomProvider | null>(null)
    const [ connected, setConnected ] = useState(false);
    const [ pubKey, setPubKey ] = useState<PublicKey | null>(null);

    useEffect(()=>{
        if("solana" in window) {
            const solWindow = window as WindowWithSolana
            if(solWindow?.solana?.isPhantom) {
                setProvider(solWindow.solana)
                props.getPhantomProvider(provider);
                setWalletAvail(true)
                const connecter = async () => {
                    await solWindow?.solana?.connect({onlyIfTrusted: true})
                }
                const network = clusterApiUrl('devnet')
                const connection = new Connection(network, 'processed')
                const anchorProvider = new AnchorProvider(connection, solWindow?.solana, { preflightCommitment: 'processed'})
                props.getAnchorProvider(anchorProvider)
                connecter();
            }
        }
    },[])

    useEffect(()=>{
        provider?.on("connect", (publicKey:PublicKey)=>{
            console.log(`connect event ${publicKey}`)
            setConnected(true)
            setPubKey(publicKey)
            props.walletAddress(publicKey.toString());
        })
        provider?.on("disconnect", ()=>{
            console.log(`disconnect event`)
            setConnected(false)
            setPubKey(null)
            props.walletAddress(null)

        })
    },[provider])

    const connectHandler: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        provider?.connect()
                .catch((err)=>{
                    console.error("connect Error", err)
                })
    }
    const disconnectHandler: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        provider?.disconnect()
                .catch((err)=>{
                    console.error("disconnect Error", err)
                })
    }

    return (
        <div>
            { walletAvail && (
                <>
                { connected && ( 
                    <>
                    <button disabled={!connected} onClick={disconnectHandler} className={"cta-button disconnect-wallet-button"}>Disconnect Phantom</button>
                    </>
                )}
                {!connected && (
                    <>
                    <button disabled={connected} onClick={connectHandler} className={"cta-button connect-wallet-button"}>Connect to Phantom</button>
                    </>
                )}
                </>
            )}
        </div>
    )
}

export { SolConnectorPhantom }