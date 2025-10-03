import type { Image } from "@/types";
import Link from "next/link";
import { MapPinIcon } from "@heroicons/react/24/solid";

const formatAddress = (address?: string | null) => {
  if (address) {
    const [_, ...lines] = address.split(",");
    return lines.join(",");
  }
  return "Open in Google Maps →";
};

export const Address = ({
  image,
  addressIconSize = "w-4 h-4",
  addressIconMargin = "mr-1.5",
}: {
  image: Image;
  addressIconSize?: string;
  addressIconMargin?: string;
}) => {
  if (!image.latitude || !image.longitude) return null;
  return (
    <Link
      href={`https://www.google.com/maps?q=${image.latitude},${image.longitude}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors my-2"
    >
      <MapPinIcon
        className={`${addressIconSize} ${addressIconMargin} flex-shrink-0`}
      />
      <span className="text-blue-400">{formatAddress(image?.address)}</span>
    </Link>
  );
};
