import type { Image } from "@/types";
import Link from "next/link";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { useLanguage } from "@/contexts/LanguageContext";

const formatAddress = (address?: string | null, fallbackText?: string) => {
  if (address) {
    const [_, ...lines] = address.split(",");
    return lines.join(",");
  }
  return fallbackText || "Open in Google Maps →";
};

export const Address = ({
  image,
  addressIconSize = "w-4 h-4",
  addressIconMargin = "mr-1.5",
  addressClassName = "",
  addressTextClassName = "",
}: {
  image: Image;
  addressIconSize?: string;
  addressIconMargin?: string;
  addressClassName?: string;
  addressTextClassName?: string;
}) => {
  const { t } = useLanguage();
  
  if (!image.latitude || !image.longitude) return null;
  return (
    <Link
      href={`https://www.google.com/maps?q=${image.latitude},${image.longitude}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center text-white text-sm font-medium transition-colors my-2 ${addressClassName}`}
    >
      <MapPinIcon
        className={`${addressIconSize} ${addressIconMargin} flex-shrink-0`}
      />
      <span className={`text-white ${addressTextClassName}`}>{formatAddress(image?.address, t.common.openInMaps)}</span>
    </Link>
  );
};
