import { type NextPage } from "next";
import Head from "next/head";

import { useQuery } from "@tanstack/react-query";
import { WeaponLite } from "../types/weaponTypes";

type ItemIcon = {
  iconWatermark?: string;
  icon: string;
  tierTypeHash: number;
};

export function ItemIcon({ item }: { item: ItemIcon }) {
  console.log(process.env.NEXT_PUBLIC_BUNGIE_URL! + item.iconWatermark);
  //basic: #c2bbb3
  //rare: #4f76a2
  //common: #366f42
  //exotic: #ceae33
  //legendary:#ccac31
  return (
    <div
      className="grid aspect-square w-16 border-[1px]"
      style={{
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundImage: `url(${
          process.env.NEXT_PUBLIC_BUNGIE_URL + item.icon
        })`,
      }}
    >
      {item.iconWatermark ? (
        <img
          src={process.env.NEXT_PUBLIC_BUNGIE_URL + item.iconWatermark}
          alt=""
        />
      ) : null}
    </div>
  );
}

const Home: NextPage = () => {
  console.log(process.env.NEXT_PUBLIC_BUNGIE_URL);

  const { data, status } = useQuery(["weapons"], () =>
    fetch("/api/WeaponsLite").then(
      (response) => response.json() as Promise<WeaponLite[]>
    )
  );
  return (
    <>
      <Head>
        <title>Kadi-One</title>
        <meta name="description" content="A destiny 2 companion app" />
      </Head>
      <main className="">
        {status === "loading" ? (
          <div>loading</div>
        ) : status === "success" ? (
          <div className="flex flex-wrap">
            {data.map((e) => (
              <ItemIcon item={e} />
            ))}
          </div>
        ) : (
          <div>oops</div>
        )}
      </main>
    </>
  );
};

export default Home;
