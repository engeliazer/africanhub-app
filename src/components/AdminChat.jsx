import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  Avatar, 
  Spin, 
  message, 
  List, 
  Badge, 
  Typography,
  Divider,
  Space,
  Tag,
  Rate
} from 'antd';
import { 
  MessageOutlined, 
  SendOutlined, 
  CloseOutlined,
  UserOutlined,
  MailOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import chatService from '../services/chat';
import { useSelector } from 'react-redux';
import { selectCurrentRole } from '../state/rbacSlice';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Text, Title } = Typography;

const POLLING_INTERVAL = 5000; // 5 seconds

const AdminChat = ({ isFullPage = false }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(isFullPage);
  const messagesEndRef = useRef(null);
  const currentRole = useSelector(selectCurrentRole);
  const navigate = useNavigate();
  const chatsPollingRef = useRef(null);
  const selectedChatPollingRef = useRef(null);

  const hasAccess = currentRole === 'SYSADMIN' || currentRole === 'SUPPORT';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      // Fetch chat list only once when component opens
      fetchChats();
    }

    // Cleanup on unmount or when chat is closed
    return () => {
      if (selectedChatPollingRef.current) {
        clearInterval(selectedChatPollingRef.current);
      }
    };
  }, [isOpen]);

  // Add new effect for selected chat polling
  useEffect(() => {
    if (selectedChat?.id) {
      fetchSelectedChat();
      // Start polling for selected chat
      selectedChatPollingRef.current = setInterval(fetchSelectedChat, POLLING_INTERVAL);
    } else {
      // Clear selected chat polling if no chat is selected
      if (selectedChatPollingRef.current) {
        clearInterval(selectedChatPollingRef.current);
      }
    }

    // Cleanup polling when selected chat changes
    return () => {
      if (selectedChatPollingRef.current) {
        clearInterval(selectedChatPollingRef.current);
      }
    };
  }, [selectedChat?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const handleOpenChat = () => {
    if (isFullPage) {
      setIsOpen(true);
    } else {
      navigate('/support/chat');
    }
  };

  const fetchChats = async () => {
    try {
      const response = await chatService.getAllChats();
      setChats(response.data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchSelectedChat = async () => {
    if (!selectedChat?.id) return;
    
    try {
      console.log(`Fetching chat with ID: ${selectedChat.id}`);
      const response = await chatService.getChatHistory(selectedChat.id);
      console.log('Received chat response:', response);
      
      if (response && response.chat_id) {
        // Ensure we preserve the chat ID since we're replacing the entire object
        setSelectedChat({
          ...response,
          id: selectedChat.id
        });
      }
    } catch (error) {
      console.error('Failed to fetch selected chat:', error);
      message.error('Failed to load chat history');
    }
  };

  const handleReply = async () => {
    if (!newMessage.trim() || !selectedChat?.id) return;

    try {
      setLoading(true);
      const response = await chatService.replyToChat(selectedChat.id, newMessage);
      console.log('Reply response:', response);
      
      // Clear the message input
      setNewMessage('');
      
      // Fetch the updated chat details
      fetchSelectedChat();
    } catch (error) {
      message.error('Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getUnreadCount = (chat) => {
    return chat.messages.filter(msg => !msg.is_read && !msg.is_from_user).length;
  };

  const hasUnreadMessages = (chat) => {
    return chat.messages.some(msg => !msg.is_read && !msg.is_from_user);
  };

  const renderChatList = () => (
    <List
      className="chat-list"
      itemLayout="horizontal"
      dataSource={chats.filter(hasUnreadMessages)}
      renderItem={(chat) => (
        <List.Item
          onClick={() => {
            // When selecting a chat, fetch its details from the specific endpoint
            const chatId = chat.id;
            console.log(`Selecting chat with ID: ${chatId}`);
            
            // Just set the ID first - the fetchSelectedChat will get the full details
            setSelectedChat({ id: chatId });
          }}
          style={{ 
            cursor: 'pointer',
            backgroundColor: selectedChat?.id === chat.id ? '#f0f2f5' : 'transparent',
            padding: '12px',
            borderRadius: '8px'
          }}
        >
          <List.Item.Meta
            avatar={
              <Badge count={getUnreadCount(chat)}>
                <Avatar icon={<UserOutlined />} />
              </Badge>
            }
            title={
              <Space>
                <Text strong>{chat.user.first_name} {chat.user.last_name}</Text>
                <Tag color="blue">{chat.user.email}</Tag>
                {chat.rating_requested && (
                  <Tag color={chat.rating_submitted ? "green" : "orange"}>
                    {chat.rating_submitted ? "Rated" : "Rating Requested"}
                  </Tag>
                )}
              </Space>
            }
            description={
              <Space direction="vertical" size="small">
                <Text type="secondary">
                  {chat.messages[chat.messages.length - 1]?.message}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <ClockCircleOutlined /> {formatTimestamp(chat.created_at)}
                </Text>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );

  const renderChatWindow = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {selectedChat?.chat_id ? (
        <>
          <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  {selectedChat.user && (
                    <>
                      <Text strong>{selectedChat.user.first_name} {selectedChat.user.last_name}</Text>
                      <Tag color="blue">{selectedChat.user.email}</Tag>
                    </>
                  )}
                  {selectedChat.rating && (
                    <Tag color="green">
                      Rated: {selectedChat.rating.rating} ⭐
                    </Tag>
                  )}
                  {selectedChat.rating_request && Object.keys(selectedChat.rating_request).length > 0 && (
                    <Tag color="orange">Rating Requested</Tag>
                  )}
                </Space>
                <Button 
                  type="primary" 
                  onClick={async () => {
                    try {
                      await chatService.requestRating(selectedChat.id);
                      message.success('Rating request sent to user');
                      // Refresh the chat to update status
                      fetchSelectedChat();
                    } catch (error) {
                      message.error('Failed to send rating request');
                    }
                  }}
                  disabled={selectedChat.rating_request && Object.keys(selectedChat.rating_request).length > 0}
                >
                  {(selectedChat.rating_request && Object.keys(selectedChat.rating_request).length > 0) ? 
                    'Rating Requested' : 'Request Rating'}
                </Button>
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <ClockCircleOutlined /> {selectedChat.messages && selectedChat.messages.length > 0 ? 
                  `Chat started on ${formatTimestamp(selectedChat.messages[0].created_at)}` : ''}
              </Text>
            </Space>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {selectedChat.messages && selectedChat.messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: msg.is_from_user ? 'row-reverse' : 'row',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}
              >
                <Avatar
                  style={{
                    backgroundColor: msg.is_from_user ? '#1890ff' : '#52c41a'
                  }}
                >
                  {msg.is_from_user ? 'U' : 'S'}
                </Avatar>
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: msg.is_from_user ? '#e6f7ff' : '#f6ffed',
                    wordBreak: 'break-word'
                  }}
                >
                  <div>{msg.message}</div>
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                    {formatTimestamp(msg.created_at)}
                  </div>
                </div>
              </div>
            ))}
            {/* Display Rating History */}
            {selectedChat.rating_history && selectedChat.rating_history.length > 0 && (
              <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '8px' }}>
                  <Text strong>Rating History</Text>
                </div>
                {selectedChat.rating_history.map((history, index) => (
                  <div key={history.id} style={{ 
                    padding: '8px', 
                    backgroundColor: history.type === 'rating' ? '#f6ffed' : '#fff7e6',
                    borderRadius: '4px',
                    marginBottom: index < selectedChat.rating_history.length - 1 ? '8px' : 0
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong>{history.type === 'rating' ? 'Rated' : 'Declined'}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatTimestamp(history.created_at)}
                      </Text>
                    </div>
                    {history.type === 'rating' && (
                      <>
                        <div style={{ margin: '4px 0' }}>
                          <Rate disabled value={history.rating} allowHalf />
                        </div>
                        {history.comment && (
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            "{history.comment}"
                          </div>
                        )}
                      </>
                    )}
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      Request by: {history.requester?.first_name} {history.requester?.last_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0' }}>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your reply..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ resize: 'none' }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleReply}
                loading={loading}
                disabled={!newMessage.trim()}
              />
            </Space.Compact>
          </div>
        </>
      ) : (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: '#999'
        }}>
          Select a chat to view messages
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (isFullPage) {
      return (
        <div style={{ 
          display: 'flex', 
          height: 'calc(100vh - 200px)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: 300, 
            borderRight: '1px solid #f0f0f0', 
            overflowY: 'auto',
            height: '100%'
          }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Spin />
              </div>
            ) : (
              renderChatList()
            )}
          </div>
          <div style={{ 
            flex: 1, 
            overflow: 'hidden',
            height: '100%'
          }}>
            {renderChatWindow()}
          </div>
        </div>
      );
    }

    // Only show the floating button for SYSADMIN and SUPPORT roles
    if (!hasAccess) {
      return null;
    }

    return (
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        {!isOpen ? (
          <Button
            type="primary"
            shape="circle"
            icon={<MessageOutlined />}
            onClick={handleOpenChat}
            style={{ width: 50, height: 50 }}
          />
        ) : (
          <Card
            style={{
              width: 800,
              height: 600,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Support Chat Management</span>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => setIsOpen(false)}
                />
              </div>
            }
          >
            <div style={{ 
              display: 'flex', 
              flex: 1, 
              overflow: 'hidden',
              height: 'calc(100% - 120px)' // Account for header and footer
            }}>
              <div style={{ 
                width: 300, 
                borderRight: '1px solid #f0f0f0', 
                overflowY: 'auto',
                height: '100%'
              }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                    <Spin />
                  </div>
                ) : (
                  renderChatList()
                )}
              </div>
              <div style={{ 
                flex: 1, 
                overflow: 'hidden',
                height: '100%'
              }}>
                {renderChatWindow()}
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  return renderContent();
};

export default AdminChat; 