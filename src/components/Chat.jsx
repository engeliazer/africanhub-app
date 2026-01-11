import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, Avatar, Spin, message, Typography, Space, Rate, Form, Divider } from 'antd';
import { MessageOutlined, SendOutlined, CloseOutlined, StarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import chatService from '../services/chat';
import { useSelector } from 'react-redux';
import { selectProfile } from '../state/profileSlice';

const { TextArea } = Input;
const { Text } = Typography;

const POLLING_INTERVAL = 5000; // 5 seconds

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [rating, setRating] = useState(null);
  const [ratingRequest, setRatingRequest] = useState(null);
  const messagesEndRef = useRef(null);
  const profile = useSelector(selectProfile);
  const currentUser = profile?.user;
  const pollingRef = useRef(null);
  const [showRating, setShowRating] = useState(false);
  const [form] = Form.useForm();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
      // Start polling
      pollingRef.current = setInterval(fetchChatHistory, POLLING_INTERVAL);
    }

    // Cleanup polling on unmount or when chat is closed
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const response = await chatService.getChatHistory();
      if (response.chat_id) {
        setChatId(response.chat_id);
        // Transform messages to match our component's format while preserving all properties
        const transformedMessages = response.messages.map(msg => ({
          id: msg.id,
          content: msg.message,
          isUser: msg.is_from_user,
          timestamp: msg.created_at,
          isRead: msg.is_read,
          senderId: msg.sender_id,
          chatId: msg.chat_id,
          updatedAt: msg.updated_at
        }));
        setMessages(transformedMessages);
        
        // Only set rating if it exists and has values
        if (response.rating && Object.keys(response.rating).length > 0) {
          setRating(response.rating);
        } else {
          setRating(null);
        }

        // Only set rating request if it exists and has values
        if (response.rating_request && 
            Object.keys(response.rating_request).length > 0 && 
            !Array.isArray(response.rating_request)) {
          setRatingRequest(response.rating_request);
          setShowRating(true);
        } else {
          setRatingRequest(null);
          setShowRating(false);
        }
      }
    } catch (error) {
      message.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setLoading(true);
      const response = await chatService.sendMessage(newMessage);
      // Transform the single message response to match our component's format
      const newMsg = {
        id: response.id,
        content: response.message,
        isUser: response.is_from_user,
        timestamp: response.created_at,
        isRead: response.is_read
      };
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      fetchChatHistory(); // Refresh messages to get any support replies
    } catch (error) {
      message.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleRatingSubmit = async (values) => {
    try {
      await chatService.submitRating(chatId, values.rating, values.comment);
      message.success('Rating submitted successfully');
      setShowRating(false);
      form.resetFields();
      // Refresh chat history to update the UI
      fetchChatHistory();
    } catch (error) {
      message.error('Failed to submit rating');
    }
  };

  const handleDeclineRating = async () => {
    try {
      await chatService.declineRating(chatId);
      message.success('Rating request declined');
      setShowRating(false);
      // Refresh chat history to update the UI
      fetchChatHistory();
    } catch (error) {
      message.error('Failed to decline rating');
    }
  };

  const renderRatingSection = () => {
    if (!showRating) return null;

    return (
      <div style={{ 
        padding: '16px',
        backgroundColor: '#f6ffed',
        borderRadius: '8px',
        margin: '8px 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <StarOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
          <Text strong>Rate Your Support Experience</Text>
        </div>
        <Form
          form={form}
          onFinish={handleRatingSubmit}
          layout="vertical"
        >
          <Form.Item
            name="rating"
            rules={[{ required: true, message: 'Please select a rating' }]}
          >
            <Rate allowHalf />
          </Form.Item>
          <Form.Item
            name="comment"
          >
            <TextArea 
              rows={3} 
              placeholder="Share your experience (optional)"
              style={{ resize: 'none' }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Rating
              </Button>
              <Button onClick={handleDeclineRating}>
                Decline
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    );
  };

  const renderRatingInfo = (rating) => {
    if (!rating || !rating.rating || Object.keys(rating).length === 0) return null;

    return (
      <div style={{ 
        padding: '12px',
        backgroundColor: '#e6f7ff',
        borderRadius: '8px',
        margin: '8px 0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px'
      }}>
        <CheckCircleOutlined style={{ color: '#1890ff', marginTop: '4px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Text strong>Support Experience Rated</Text>
            <Rate disabled defaultValue={rating.rating} />
          </div>
          {rating.comment && (
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
              "{rating.comment}"
            </Text>
          )}
          <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginTop: '4px' }}>
            Rated on {formatTimestamp(rating.created_at)}
          </Text>
        </div>
      </div>
    );
  };

  const renderRatingRequest = (request) => {
    if (!request || 
        Object.keys(request).length === 0 || 
        Array.isArray(request) ||
        !request.status ||
        request.status === 'rated') {
      return null;
    }

    return (
      <div style={{ 
        padding: '12px',
        backgroundColor: '#fff7e6',
        borderRadius: '8px',
        margin: '8px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <StarOutlined style={{ color: '#faad14' }} />
        <div>
          <Text strong>Support Experience Rating Requested</Text>
          <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
            {request.requester ? 
              `Requested by ${request.requester.first_name} ${request.requester.last_name}` :
              'Rating request received'
            }
          </Text>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      {!isOpen ? (
        <Button
          type="primary"
          shape="circle"
          icon={<MessageOutlined />}
          onClick={() => setIsOpen(true)}
          style={{ width: 50, height: 50 }}
        />
      ) : (
        <Card
          style={{
            width: 350,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          bodyStyle={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden'
          }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Chat Support</span>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setIsOpen(false)}
              />
            </div>
          }
        >
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
            {loading && messages.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Spin />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: msg.isUser ? 'row-reverse' : 'row',
                      gap: '8px',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Avatar
                      style={{
                        backgroundColor: msg.isUser ? '#1890ff' : '#52c41a'
                      }}
                    >
                      {msg.isUser ? 'U' : 'S'}
                    </Avatar>
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        backgroundColor: msg.isUser ? '#e6f7ff' : '#f6ffed',
                        wordBreak: 'break-word'
                      }}
                    >
                      <div>{msg.content}</div>
                      <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                        {formatTimestamp(msg.timestamp)}
                        {msg.updatedAt && msg.updatedAt !== msg.timestamp && (
                          <span style={{ marginLeft: '8px' }}>
                            (edited {formatTimestamp(msg.updatedAt)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {renderRatingInfo(rating)}
                {renderRatingRequest(ratingRequest)}
                {renderRatingSection()}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ 
            padding: '12px', 
            borderTop: '1px solid #f0f0f0',
            display: 'flex', 
            gap: '8px',
            backgroundColor: '#fff'
          }}>
            <TextArea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ resize: 'none' }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              loading={loading}
              disabled={!newMessage.trim()}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default Chat; 