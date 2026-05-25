import sys

path = r'c:\Projects\messageing\frontend\src\App.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

insertion = """    }
  }, [theme]);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const messagesEndRef          = useRef(null);
  const socketRef               = useRef(null);
  const observerRef             = useRef(null);
  const chatContainerRef        = useRef(null);
  const fileInputRef            = useRef(null);
  const mediaRecorderRef        = useRef(null);
  const audioChunksRef          = useRef([]);
  const recordingTimerRef       = useRef(null);
  const audioRefs               = useRef({});
  const sidebarRef              = useRef(null);
  const resizeRef               = useRef(null);
  const headerRef               = useRef(null);
  const isUserScrolling         = useRef(false);
  const lastScrollTop           = useRef(0);
  const typingTimeoutRef        = useRef({});
  const messageVisibilityTimers = useRef({});
  const wsHandlersRef           = useRef({});

  const toast = useToast();

  // ── Disclosure hooks ─────────────────────────────────────────────────────────
  const { isOpen: isDeleteOpen,        onOpen: onDeleteOpen,        onClose: onDeleteClose        } = useDisclosure();
  const { isOpen: isConvDeleteOpen,                                 onClose: onConvDeleteClose     } = useDisclosure();
  const { isOpen: isImageOpen,         onOpen: onImageOpen,         onClose: onImageClose          } = useDisclosure();
  const { isOpen: isFriendRequestsOpen,                             onClose: onFriendRequestsClose } = useDisclosure();
  const { isOpen: isForwardModalOpen,  onOpen: onForwardModalOpen,  onClose: onForwardModalClose   } = useDisclosure();
  const { isOpen: isGroupChatModalOpen,onOpen: onGroupChatModalOpen,onClose: onGroupChatModalClose } = useDisclosure();
  const { isOpen: isDrawerOpen,        onOpen: onDrawerOpen,        onClose: onDrawerClose         } = useDisclosure();
  const [activeTab, setActiveTab] = useState('chats');

  // ── Scroll helper ─────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, []);

  useEffect(() => {
    if (!selectedUser || !conversations.length) return;
    const conv = conversations.find(c => c.username === selectedUser);
    if (conv && conv.messages.length > 0 && !isUserScrolling.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 50) scrollToBottom();
    }
  }, [conversations, selectedUser, scrollToBottom]);

  useEffect(() => {
    isUserScrolling.current = false;
"""

for i in range(len(lines)):
    if lines[i].strip() == '}':
        if i + 1 < len(lines) and 'lastScrollTop.current   = 0;' in lines[i+1]:
            lines[i] = insertion
            break

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
