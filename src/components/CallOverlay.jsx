import React, { useEffect, useRef } from 'react';
import {
  Box, Flex, VStack, HStack, Text, Avatar, IconButton, Portal,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash,
  FaVideo, FaVideoSlash,
} from 'react-icons/fa';
import { formatTime } from '../utils/formatters';

const MotionFlex = motion(Flex);

function CallOverlay({
  callState,
  callType,
  partnerUsername,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  duration,
  acceptCall,
  rejectCall,
  cancelCall,
  endCall,
  toggleMute,
  toggleCamera,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Sync streams to video tags
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  if (callState === 'idle') return null;

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const rippleVariants = {
    animate: {
      scale: [1, 1.4, 1.8],
      opacity: [0.6, 0.3, 0],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: 'easeOut',
      },
    },
  };

  return (
    <Portal>
      <AnimatePresence>
        <MotionFlex
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex="99999"
          bg="rgba(10, 10, 10, 0.92)"
          backdropFilter="blur(20px)"
          align="center"
          justify="center"
          color="white"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
          fontFamily="'Inter', sans-serif"
          p={4}
        >
          {/* Main Card container */}
          <Box
            position="relative"
            w="100%"
            maxW={{ base: '100%', md: '900px' }}
            h={{ base: '100%', md: '650px' }}
            bg="rgba(25, 25, 25, 0.45)"
            border={{ base: 'none', md: '1px solid rgba(255, 255, 255, 0.08)' }}
            boxShadow="2xl"
            rounded={{ base: 'none', md: '3xl' }}
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            {/* ── VIDEO CALL CANVAS ── */}
            {callType === 'video' && (callState === 'connected' || callState === 'connecting') && (
              <Box position="absolute" top="0" left="0" w="100%" h="100%" zIndex="1" bg="black">
                {/* Remote Video (Full Screen inside card) */}
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Flex w="100%" h="100%" align="center" justify="center" direction="column" bg="rgba(20,20,20,0.9)">
                    <Avatar
                      size="2xl"
                      name={partnerUsername}
                      bgGradient="linear(135deg, #6c5ce7, #a29bfe)"
                      mb={4}
                    />
                    <Text fontSize="lg" color="gray.400" fontWeight="500">
                      Connecting video stream...
                    </Text>
                  </Flex>
                )}

                {/* Local Video (Floating PIP) */}
                {localStream && (
                  <Box
                    position="absolute"
                    top={{ base: '16px', md: '24px' }}
                    right={{ base: '16px', md: '24px' }}
                    w={{ base: '90px', md: '140px' }}
                    h={{ base: '140px', md: '210px' }}
                    bg="rgba(0, 0, 0, 0.4)"
                    border="2px solid rgba(255, 255, 255, 0.2)"
                    rounded="2xl"
                    overflow="hidden"
                    zIndex="10"
                    boxShadow="lg"
                    style={{ display: isCameraOff ? 'none' : 'block' }}
                  >
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)', // mirror local track
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}

            {/* ── CONTENT OVERLAY (States: Incoming, Outgoing, Connected Audio) ── */}
            <Flex
              direction="column"
              align="center"
              justify="space-between"
              h="100%"
              w="100%"
              py={10}
              px={6}
              position="relative"
              zIndex="2"
            >
              {/* Call Header / status */}
              <VStack spacing={2} align="center">
                <Text
                  fontSize="xs"
                  fontWeight="800"
                  letterSpacing="0.15em"
                  color="#a29bfe"
                  textTransform="uppercase"
                >
                  {callType === 'video' ? 'Video Call' : 'Voice Call'}
                </Text>
                
                {callState === 'connected' && (
                  <Text fontSize="2xl" fontWeight="700" fontFamily="monospace">
                    {formatTime(duration)}
                  </Text>
                )}
              </VStack>

              {/* Call Body */}
              <Flex direction="column" align="center" justify="center" flex="1" w="full">
                {/* Visualizer for audio call OR non-connected states */}
                {(callType === 'audio' || callState === 'incoming' || callState === 'outgoing') && (
                  <Box position="relative" mb={6}>
                    {/* Ringing waves */}
                    {(callState === 'incoming' || callState === 'outgoing' || callState === 'connecting') && (
                      <>
                        <Box
                          as={motion.div}
                          position="absolute"
                          top="-15px"
                          left="-15px"
                          right="-15px"
                          bottom="-15px"
                          border="1px solid rgba(108, 92, 231, 0.4)"
                          rounded="full"
                          variants={rippleVariants}
                          animate="animate"
                        />
                        <Box
                          as={motion.div}
                          position="absolute"
                          top="-30px"
                          left="-30px"
                          right="-30px"
                          bottom="-30px"
                          border="1px solid rgba(162, 155, 254, 0.2)"
                          rounded="full"
                          variants={rippleVariants}
                          animate="animate"
                          style={{ animationDelay: '0.6s' }}
                        />
                      </>
                    )}

                    <Avatar
                      size="2xl"
                      name={partnerUsername}
                      bgGradient="linear(135deg, #6c5ce7, #a29bfe)"
                      boxShadow="0 0 30px rgba(108, 92, 231, 0.4)"
                      border="4px solid"
                      borderColor={callState === 'connected' ? '#00d26a' : 'rgba(255, 255, 255, 0.15)'}
                    />
                  </Box>
                )}

                {/* Info Text */}
                <VStack spacing={2} mt={2}>
                  <Text fontSize="2xl" fontWeight="700" color="white">
                    {partnerUsername}
                  </Text>
                  
                  <Text fontSize="sm" color="gray.400" fontWeight="500">
                    {callState === 'incoming' && 'Incoming Call...'}
                    {callState === 'outgoing' && 'Calling...'}
                    {callState === 'connecting' && 'Connecting...'}
                    {callState === 'connected' && callType === 'audio' && 'Active Call'}
                    {callState === 'connected' && callType === 'video' && ''}
                    {callState === 'ended' && 'Call Ended'}
                  </Text>

                  {/* Audio Call Sound Wave (Mock animated visualizer) */}
                  {callState === 'connected' && callType === 'audio' && (
                    <HStack spacing={1.5} h="24px" mt={4} justify="center">
                      {[...Array(6)].map((_, i) => (
                        <Box
                          key={i}
                          as={motion.div}
                          w="3px"
                          bg="#a29bfe"
                          rounded="full"
                          animate={{
                            height: ['8px', '24px', '8px'],
                          }}
                          transition={{
                            duration: 0.8 + i * 0.1,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </HStack>
                  )}
                </VStack>
              </Flex>

              {/* Call Controls Footer */}
              <Box w="full" maxW="360px">
                <AnimatePresence mode="wait">
                  {/* Incoming Call Controls */}
                  {callState === 'incoming' && (
                    <HStack spacing={6} justify="center" w="full" key="incoming-controls">
                      {/* Decline */}
                      <VStack spacing={2}>
                        <IconButton
                          aria-label="Decline Call"
                          icon={<FaPhoneSlash size={18} />}
                          colorScheme="red"
                          onClick={rejectCall}
                          size="lg"
                          rounded="full"
                          w="60px"
                          h="60px"
                          boxShadow="0 4px 15px rgba(229, 62, 62, 0.4)"
                          _hover={{ transform: 'scale(1.1)' }}
                          _active={{ transform: 'scale(0.95)' }}
                        />
                        <Text fontSize="xs" color="gray.400" fontWeight="600">Decline</Text>
                      </VStack>

                      {/* Accept */}
                      <VStack spacing={2}>
                        <IconButton
                          aria-label="Accept Call"
                          icon={callType === 'video' ? <FaVideo size={18} /> : <FaPhone size={18} />}
                          colorScheme="green"
                          onClick={acceptCall}
                          size="lg"
                          rounded="full"
                          w="60px"
                          h="60px"
                          boxShadow="0 4px 15px rgba(72, 187, 120, 0.4)"
                          _hover={{ transform: 'scale(1.1)' }}
                          _active={{ transform: 'scale(0.95)' }}
                        />
                        <Text fontSize="xs" color="gray.400" fontWeight="600">Accept</Text>
                      </VStack>
                    </HStack>
                  )}

                  {/* Outgoing Call Controls */}
                  {callState === 'outgoing' && (
                    <Flex justify="center" w="full" key="outgoing-controls">
                      <VStack spacing={2}>
                        <IconButton
                          aria-label="Cancel Call"
                          icon={<FaPhoneSlash size={18} />}
                          colorScheme="red"
                          onClick={cancelCall}
                          size="lg"
                          rounded="full"
                          w="60px"
                          h="60px"
                          boxShadow="0 4px 15px rgba(229, 62, 62, 0.4)"
                          _hover={{ transform: 'scale(1.1)' }}
                          _active={{ transform: 'scale(0.95)' }}
                        />
                        <Text fontSize="xs" color="gray.400" fontWeight="600">Cancel</Text>
                      </VStack>
                    </Flex>
                  )}

                  {/* Connected Call Controls */}
                  {(callState === 'connected' || callState === 'connecting') && (
                    <HStack
                      spacing={5}
                      justify="center"
                      w="full"
                      bg="rgba(30, 30, 30, 0.75)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      rounded="2xl"
                      py={3}
                      px={6}
                      backdropFilter="blur(10px)"
                      key="connected-controls"
                    >
                      {/* Mute Mic */}
                      <IconButton
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                        icon={isMuted ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
                        color={isMuted ? 'white' : 'gray.300'}
                        bg={isMuted ? 'red.500' : 'rgba(255,255,255,0.08)'}
                        _hover={{ bg: isMuted ? 'red.600' : 'rgba(255,255,255,0.15)' }}
                        onClick={toggleMute}
                        size="md"
                        rounded="full"
                      />

                      {/* Camera Toggle (Video calls only) */}
                      {callType === 'video' && (
                        <IconButton
                          aria-label={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                          icon={isCameraOff ? <FaVideoSlash size={16} /> : <FaVideo size={16} />}
                          color={isCameraOff ? 'white' : 'gray.300'}
                          bg={isCameraOff ? 'red.500' : 'rgba(255,255,255,0.08)'}
                          _hover={{ bg: isCameraOff ? 'red.600' : 'rgba(255,255,255,0.15)' }}
                          onClick={toggleCamera}
                          size="md"
                          rounded="full"
                        />
                      )}

                      {/* End Call */}
                      <IconButton
                        aria-label="End Call"
                        icon={<FaPhoneSlash size={18} />}
                        colorScheme="red"
                        onClick={endCall}
                        size="lg"
                        rounded="full"
                        w="52px"
                        h="52px"
                        boxShadow="0 4px 12px rgba(229, 62, 62, 0.3)"
                        _hover={{ transform: 'scale(1.05)' }}
                        _active={{ transform: 'scale(0.95)' }}
                      />
                    </HStack>
                  )}

                  {/* Ended Call Controls */}
                  {callState === 'ended' && (
                    <Flex justify="center" w="full" key="ended-controls">
                      <IconButton
                        aria-label="Call Ended"
                        icon={<FaPhoneSlash size={18} />}
                        bg="gray.600"
                        color="white"
                        size="lg"
                        rounded="full"
                        w="60px"
                        h="60px"
                        isDisabled
                      />
                    </Flex>
                  )}
                </AnimatePresence>
              </Box>
            </Flex>
          </Box>
        </MotionFlex>
      </AnimatePresence>
    </Portal>
  );
}

export default CallOverlay;
