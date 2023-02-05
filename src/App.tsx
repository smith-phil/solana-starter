import React, { useEffect, useState } from 'react';
import { PhantomProvider, SolConnectorPhantom } from './components/SolConnector';
import twitterLogo from './twitter-logo.svg';
import './App.css';
import { PublicKey } from '@solana/web3.js';
import {
  Program, AnchorProvider, web3
} from '@project-serum/anchor';
import { Buffer } from "buffer";
import { URL } from 'url';

window.Buffer = Buffer;

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
let baseAccount = Keypair.generate()
let gifBaseAccount = new PublicKey("4UmsRefodnS4aDNhzKgzKXLFp9AaHPvatTUFBxq157Td")

interface GifItemStruct {
  gifLink: string,
  userAddress: PublicKey,
  upVotes: number
}

// This is the address of your solana program, if you forgot, just run solana address -k target/deploy/myepicproject-keypair.json
const programID = new PublicKey("CLU6eaCQoupE3mXVGt9ZC5FzS5S472zSh14Yrku4kVve");

function App() {

  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [provider, setProvider] = useState<PhantomProvider | null>(null) // TODO apparently not using this at all, remove
  const [anchorProvider, setAnchorProvider] = useState<AnchorProvider | null>(null)
  const [inputUrl, setInputUrl] = useState("")
  const [gifList, setGifList] = useState<Array<GifItemStruct>>([])
  const [gifVoteIndex, setGifVoteIndex] = useState<number | null>(null)

  const getProgram = async () => {
    // Get metadata about your solana program
    if (anchorProvider) {
      const idl = await Program.fetchIdl(programID, anchorProvider);
      if (idl) {
        return new Program(idl, programID, anchorProvider);
      }
    }
    return null
  };

  const getGifList = async () => {
    const program = await getProgram()
    if(program !== null) {
      const progAccount = await program?.account.baseAccount.fetch(gifBaseAccount)
      console.log('Got the account', progAccount)
      console.log('Gif list is ', progAccount?.gifList)
      setGifList(progAccount?.gifList);
    }
  }

  const sendGif = async () => {
    if (inputUrl.length > 0) {
      if(!isValidURL(inputUrl)) {
        console.error(`${inputUrl} is not valid`)
        return
      }
      // TODO set this as state
      const program = await getProgram()
      // TODO set this as state
      let walletPubKey = anchorProvider?.wallet?.publicKey
      if(program && walletPubKey) {
        console.log('>>>>> INPUT URL IS ', inputUrl)
        await program.rpc.addGif(inputUrl, {
          accounts: {
            baseAccount: gifBaseAccount,
            user: walletPubKey,
          },
        });
      await getGifList();
      } else {
        console.log('Cannot connect to solana')
      }
      setInputUrl("")
    }
  }
  function isValidURL(url:string) {
    var res = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
  };

  const createGifAccount = async () => {
    const program = await getProgram()
    let walletPubKey = anchorProvider?.wallet?.publicKey
    if (program && walletPubKey) {
      await program?.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: walletPubKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      })
    }
  }

  const upvote = async (i:number) => {
    const program = await getProgram()
    // TODO set this as state
    let walletPubKey = anchorProvider?.wallet?.publicKey
    if(program && walletPubKey) {
      const gifItem = gifList[i];
      await program.rpc.upvoteGif(gifItem, {
        accounts: {
          baseAccount: gifBaseAccount,
          user: walletPubKey,
        },
      });
    }
    await getGifList();
  }

  const upvoteGif = (i:number) => {
    upvote(i)
  }

  useEffect(() => {
    if (walletAddress) {
      getGifList()
    }
  }, [walletAddress])

  useEffect(()=>{
    document.title = "Solana Starter dApp"
  })

  // TODO: Move this into it's own functional component
  const renderConnectedContainer = () => {
    if (!gifList || gifList.length == null) {
      return (
        <div className='connected-container'>
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else {
    return (<div className='connected-container'>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          // alert('submit')
          sendGif()
        }}
      >
        <input type="text" placeholder="Enter gif link!" value={inputUrl} onChange={e => setInputUrl(e.target.value)} />
        <button type="submit" className="cta-button submit-gif-button">Submit</button>
      </form>
      <div className="gif-grid">
        {gifList.map((gif,i) => { 
          if(isValidURL(gif.gifLink)) {
          return (
          <div className="gif-item" key={`gif_grid_item_${i}`}>
            <img src={gif.gifLink} alt={gif.gifLink} key={`gif_grid_item_img_${i}`} />
            <div className="gif-details">
            <p className='upvote'><span onClick={e=>upvoteGif(i)}>👍</span></p>
            <p className='user-address'>{ `Vote count = ${gif.upVotes}` }</p>
            </div>
          </div>
        )}})}
      </div>
    </div>)
    }
  }

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            Solana Devnet GIF collection in the metaverse ✨
          </p>

        </div>
        {walletAddress && (
          renderConnectedContainer()
        )}
        <SolConnectorPhantom
          walletAddress={setWalletAddress}
          getPhantomProvider={setProvider}
          getAnchorProvider={setAnchorProvider} />
        <div className="footer-container">
          
        </div>
      </div>
    </div>
  );
}



export default App;
