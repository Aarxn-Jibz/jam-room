import type { ImgHTMLAttributes } from 'react'

export type StaticImageData = string

type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string; fill?: boolean; priority?: boolean; placeholder?: string }

export default function Image({ fill, priority, placeholder: _placeholder, src, style, ...props }: Props) {
  return <img src={src} loading={priority ? 'eager' : 'lazy'} style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style } : style} {...props} />
}
