import React from 'react'
import { TextGenerateEffect } from './ui/text-generate-effect'
import MagicButton from './ui/MagicButton'
import { FaLocationArrow } from 'react-icons/fa'
import { GlowingStarsBackground } from './ui/glowing-stars'

const Hero = () => {
  return (
    <div className='pb-20 pt-36'>
      <GlowingStarsBackground className="z-0"/>
     
    <div className='flex justify-center relative my-20 z-10'>
      <div className='max-w-[89vw] md:max-w-2xl lg:max-w-[60vw] flex flex-col items-center justify-center'>
        <h2 className='uppercase tracking-widest text-xs text-center text-blue-100 max-w-80 px-4'>
          Welcome to the Official Website of the
        </h2>
    <TextGenerateEffect className="text-center text-[28px] sm:text-[40px] md:text-5xl lg:text-6xl px-4" words="Student Welfare Office Kengeri" />
    <p className='text-center md:tracking-wider mb-4 text-sm md:text-lg lg:text-2xl'>platform that focuses on holistic development amongst Christites</p>
      </div>
    </div>
    </div>
  )
}

export default Hero
