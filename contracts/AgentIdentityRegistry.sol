// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AgentIdentityRegistry
/// @notice On-chain registry for AI agent identities linked to ENS names
contract AgentIdentityRegistry {
    struct AgentIdentity {
        address agentAddress;
        string ensName;
        string agentType;
        uint256 reputationScore;
        bool verified;
        uint256 registeredAt;
    }

    AgentIdentity[] private agents;
    mapping(address => uint256) private addressToId;
    mapping(address => bool) private hasRegistered;

    address public owner;

    event AgentRegistered(address indexed agentAddress, string ensName, string agentType);
    event ReputationUpdated(address indexed agentAddress, uint256 newScore);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Register the caller as an agent
    function registerAgent(string calldata ensName, string calldata agentType) external {
        require(!hasRegistered[msg.sender], "Already registered");
        require(bytes(ensName).length > 0, "Empty ENS name");

        uint256 id = agents.length;
        agents.push(AgentIdentity({
            agentAddress: msg.sender,
            ensName: ensName,
            agentType: agentType,
            reputationScore: 0,
            verified: false,
            registeredAt: block.timestamp
        }));
        addressToId[msg.sender] = id;
        hasRegistered[msg.sender] = true;

        emit AgentRegistered(msg.sender, ensName, agentType);
    }

    /// @notice Update reputation score for an agent (owner only)
    function updateReputation(uint256 agentId, uint256 score) external onlyOwner {
        require(agentId < agents.length, "Invalid agent ID");
        require(score <= 100, "Score exceeds maximum");

        agents[agentId].reputationScore = score;
        emit ReputationUpdated(agents[agentId].agentAddress, score);
    }

    /// @notice Get agent by ID
    function getAgent(uint256 id) external view returns (AgentIdentity memory) {
        require(id < agents.length, "Invalid agent ID");
        return agents[id];
    }

    /// @notice Get total number of registered agents
    function getAgentCount() external view returns (uint256) {
        return agents.length;
    }

    /// @notice Get agent ID by address
    function getAgentByAddress(address addr) external view returns (uint256) {
        require(hasRegistered[addr], "Agent not registered");
        return addressToId[addr];
    }
}
