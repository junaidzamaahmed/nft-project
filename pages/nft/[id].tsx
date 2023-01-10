import React, { useEffect, useState } from "react";
import {
  useAddress,
  useMetamask,
  useDisconnect,
  useNFTs,
  useContract,
  useNFT,
  useTotalCount,
} from "@thirdweb-dev/react";
import { GetServerSideProps } from "next";
import { sanityClient, urlFor } from "../../sanity";
import { Collection } from "../../typings";
import Link from "next/link";
import Head from "next/head";
import { BigNumber } from "ethers";
import toast, { Toaster } from "react-hot-toast";

interface Props {
  collections: Collection;
}

function NFTDropPage({ collections }: Props) {
  // NFT Claimed
  const [totalSupply, setTotalSupply] = useState<BigNumber>();
  const [claimed, setClaimed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [price, setPrice] = useState<string>();
  const nftDrop = useContract(collections.address, "nft-drop").contract;

  useEffect(() => {
    if (!nftDrop) return;
    const fetchNFTDropData = async () => {
      setIsLoading(true);
      const claimed = await nftDrop.getAllClaimed();
      const total = await nftDrop.totalSupply();
      const info = await nftDrop.claimConditions.getAll();
      setClaimed(claimed.length);
      setTotalSupply(total);
      setIsLoading(false);
      setPrice(info[0].currencyMetadata.displayValue);
    };

    fetchNFTDropData();
  }, [nftDrop]);

  // Authentication
  const address = useAddress();
  const connectWithMetamask = useMetamask();
  const disconnect = useDisconnect();

  const mintNft = () => {
    if (!nftDrop || !address) return;
    setIsLoading(true);
    const notification = toast.loading("Minting...", {
      style: {
        background: "white",
        color: "green",
        fontWeight: "bolder",
        fontSize: "17px",
        padding: "20px",
      },
    });
    nftDrop
      .claimTo(address, 1)
      .then(async (tx) => {
        toast("Minted Successfully!", {
          duration: 8000,
          style: {
            background: "white",
            color: "green",
            fontWeight: "bolder",
            fontSize: "17px",
            padding: "20px",
          },
        });
        console.log(tx);
      })
      .catch((err) => {
        console.log(err);
        toast("Oops, something went wrong!", {
          duration: 8000,
          style: {
            background: "red",
            color: "white",
            fontWeight: "bolder",
            fontSize: "17px",
            padding: "20px",
          },
        });
      })
      .finally(() => {
        setIsLoading(false);
        toast.dismiss(notification);
      });
  };

  return (
    <div className="flex h-screen flex-col lg:grid lg:grid-cols-10">
      <Toaster position="bottom-center" />
      <Head>
        <title>{collections.title}</title>
      </Head>
      {/* LEFT */}
      <div className="bg-gradient-to-br from-cyan-800 to-rose-500 lg:col-span-4">
        <div className="flex flex-col items-center justify-center py-2 lg:min-h-screen">
          <div className="bg-gradient-to-br from-yellow-400 to-purple-600 p-2 rounded-xl">
            <img
              className="w-64 rounded-xl object-cover lg:h-96 lg:w-72"
              src={urlFor(collections.previewImage).url()}
              alt="NFT"
            />
          </div>
          <div className="text-center p-5 space-y-2">
            <h1 className="text-4xl font-bold text-white">
              {collections.nftCollectionName}
            </h1>
            <h2 className="text-400 text-gray-300">
              {collections.description}
            </h2>
          </div>
        </div>
      </div>
      {/* RIGHT */}
      <div className="flex flex-1 flex-col p-12 lg:col-span-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href={"/"}>
            <h1 className="w-52 cursor-pointer text-xl font-extralight sm:w-80">
              The biggest{" "}
              <span className="font-extrabold underline decoration-pink-600/50">
                NFT
              </span>{" "}
              Marketplace right now!
            </h1>
          </Link>
          <button
            onClick={() => (address ? disconnect() : connectWithMetamask())}
            className="rounded-full bg-rose-400 px-4 py-2 text-white text-xs font-bold lg:px-5 lg:py-3 lg:text-base"
          >
            {address ? "Sign Out" : "Sign In"}
          </button>
        </header>
        <hr className="my-2 border" />
        {address && (
          <p className="text-center text-sm text-rose-400">
            You're logged in with wallet {address.substring(0, 5)}...
            {address.substring(address.length - 5)}
          </p>
        )}

        {/* Content */}
        <div className="mt-10 flex flex-1 flex-col items-center space-y-6 text-center lg:space-y-0 lg:justify-center">
          <img
            className="w-80 object-cover lg:h-40"
            src={urlFor(collections.mainImage).url()}
            alt=""
          />
          <h1 className="text-3xl font-bold lg:text-5xl lg:font-extrabold">
            {collections.title}
          </h1>
          {isLoading ? (
            <p className="animate-pulse p-2 text-xl text-green-500">
              Loading Supply Count...
            </p>
          ) : (
            <p className="p-2 text-xl text-green-500">
              {claimed}/{totalSupply?.toString()} NFT's claimed
            </p>
          )}
          {isLoading && (
            <img
              className="w-80 h-80 object-contain"
              src="https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif"
              alt=""
            ></img>
          )}
        </div>
        {/* Mint Button */}
        <button
          onClick={mintNft}
          disabled={isLoading || claimed == totalSupply?.toNumber() || !address}
          className="h-16 w-full bg-red-600 text-white rounded-full mt-10 disabled:bg-gray-400"
        >
          {isLoading ? (
            <>Loading...</>
          ) : claimed == totalSupply?.toNumber() ? (
            <>Sold Out</>
          ) : !address ? (
            <>Sign In to Mint</>
          ) : (
            <span className="font-bold">Mint NFT ({price} ETH)</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default NFTDropPage;
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const query = `*[_type=="collection" && slug.current==$id][0]{
  _id,
  title,
  address,
  description,
  nftCollectionName,
  mainImage {
  asset
  },
  previewImage {
    asset
  },
  slug {
    current
  },
  creator-> {
    _id,
    name,
    address,
    slug {
      current
    },
  }
}`;
  const collections = await sanityClient.fetch(query, { id: params?.id });
  if (!collections) {
    return { notFound: true };
  }
  return {
    props: { collections },
  };
};
