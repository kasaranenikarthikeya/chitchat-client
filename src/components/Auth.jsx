import React from 'react';
import {
    Box, Button, Flex, FormControl, FormLabel, Heading,
    IconButton, Input, InputGroup, InputRightElement, Text, VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaComments } from 'react-icons/fa';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

function Auth({
    username, setUsername, password, setPassword,
    showPassword, setShowPassword,
    isRegistering, setIsRegistering,
    handleAuth, isLoading, currentTheme,
}) {
    const submitOnEnter = (event) => {
        if (event.key === 'Enter' && username.trim() && password.trim()) {
            handleAuth();
        }
    };

    return (
        <Flex
            minH="100dvh" w="100vw"
            align="center" justify="center"
            bg={currentTheme?.chat || 'var(--primary-bg)'}
            position="relative" overflow="hidden"
        >
            {/* Animated Background Orbs */}
            <Box
                position="absolute" top="-20%" left="-10%"
                w="500px" h="500px" borderRadius="full"
                bg="rgba(108, 92, 231, 0.08)" filter="blur(100px)"
                animation="floatOrb 20s ease-in-out infinite"
                pointerEvents="none"
            />
            <Box
                position="absolute" bottom="-15%" right="-10%"
                w="400px" h="400px" borderRadius="full"
                bg="rgba(253, 121, 168, 0.06)" filter="blur(80px)"
                animation="floatOrb 15s ease-in-out infinite reverse"
                pointerEvents="none"
            />

            <MotionBox
                w="full" maxW="400px" mx={4}
                bg="var(--glass-bg)"
                backdropFilter="blur(24px)"
                border="1px solid" borderColor="var(--glass-border)"
                rounded="2xl"
                boxShadow="0 24px 80px rgba(0,0,0,0.4)"
                p={{ base: 7, md: 9 }}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
            >
                <VStack spacing={7} align="stretch">
                    {/* Logo & Title */}
                    <VStack spacing={3}>
                        <MotionBox
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                        >
                            <Flex
                                w="56px" h="56px" rounded="xl" align="center" justify="center"
                                bgGradient="linear(135deg, #6c5ce7, #a29bfe)"
                                boxShadow="0 4px 20px rgba(108, 92, 231, 0.4)"
                            >
                                <FaComments size={24} color="white" />
                            </Flex>
                        </MotionBox>
                        <Heading
                            size="lg" fontWeight="700"
                            bgGradient="linear(to-r, #6c5ce7, #a29bfe, #fd79a8)"
                            bgClip="text" letterSpacing="-0.02em"
                        >
                            ChitChat
                        </Heading>
                        <Text color="var(--text-secondary)" fontSize="sm" textAlign="center">
                            {isRegistering ? 'Create your account to start chatting' : 'Welcome back! Log in to continue'}
                        </Text>
                    </VStack>

                    {/* Form Fields */}
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel color="var(--text-secondary)" fontSize="sm" fontWeight="500" mb={1.5}>
                                Username
                            </FormLabel>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={submitOnEnter}
                                placeholder="Enter username"
                                autoComplete="username"
                                bg="var(--glass-bg-light)"
                                border="1px solid" borderColor="var(--glass-border)"
                                color="white" rounded="xl" h="46px"
                                _placeholder={{ color: 'var(--text-secondary)' }}
                                _focus={{
                                    borderColor: 'var(--accent-primary)',
                                    boxShadow: '0 0 0 3px rgba(108, 92, 231, 0.2)',
                                    bg: 'var(--glass-bg-hover)',
                                }}
                                _hover={{ borderColor: 'var(--glass-border-hover)' }}
                                transition="all 0.2s ease"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel color="var(--text-secondary)" fontSize="sm" fontWeight="500" mb={1.5}>
                                Password
                            </FormLabel>
                            <InputGroup>
                                <Input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={submitOnEnter}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter password"
                                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                                    bg="var(--glass-bg-light)"
                                    border="1px solid" borderColor="var(--glass-border)"
                                    color="white" rounded="xl" h="46px" pr="3rem"
                                    _placeholder={{ color: 'var(--text-secondary)' }}
                                    _focus={{
                                        borderColor: 'var(--accent-primary)',
                                        boxShadow: '0 0 0 3px rgba(108, 92, 231, 0.2)',
                                        bg: 'var(--glass-bg-hover)',
                                    }}
                                    _hover={{ borderColor: 'var(--glass-border-hover)' }}
                                    transition="all 0.2s ease"
                                />
                                <InputRightElement h="46px">
                                    <IconButton
                                        icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                                        onClick={() => setShowPassword((p) => !p)}
                                        variant="ghost" color="var(--text-secondary)" size="sm"
                                        _hover={{ color: 'white' }}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    />
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                    </VStack>

                    {/* Submit Button */}
                    <MotionButton
                        onClick={handleAuth}
                        isLoading={isLoading}
                        isDisabled={!username.trim() || !password.trim()}
                        color="white" size="lg" h="48px"
                        bgGradient="linear(135deg, #6c5ce7, #a29bfe)"
                        rounded="xl" fontWeight="600" fontSize="md"
                        _hover={{ opacity: 0.9 }}
                        _active={{ transform: 'scale(0.98)' }}
                        boxShadow="0 4px 20px rgba(108, 92, 231, 0.35)"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {isRegistering ? 'Create Account' : 'Log In'}
                    </MotionButton>

                    {/* Toggle */}
                    <Button
                        onClick={() => setIsRegistering((p) => !p)}
                        variant="ghost" color="var(--text-secondary)"
                        _hover={{ color: 'white', bg: 'var(--glass-bg-light)' }}
                        fontSize="sm" fontWeight="400" rounded="xl"
                    >
                        {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Register"}
                    </Button>
                </VStack>
            </MotionBox>
        </Flex>
    );
}

export default Auth;
